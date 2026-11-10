"""Blog rules: who sees what, who may change what.

- Readers only ever see published articles; drafts exist for editors only.
- Editors and admins write, edit and delete every article.
- Logged-in readers like, save and comment published articles. A comment is
  deleted by its author, or by an editor or an admin.
- A cover image is uploaded first (upload_image gives its key), then saved
  with the article, always with a text alternative. Replaced or deleted
  covers are removed from disk a day later (see images.py).
"""

import asyncio
from collections.abc import Callable
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, status

from app.core.config import settings
from app.enums.user_role import EDITORIAL_ROLES
from app.models.blog import (
    ARTICLE_PUBLISHED,
    BlogArticle,
    BlogComment,
    BlogFavorite,
    BlogLike,
)
from app.models.user import User
from app.repositories.blog.blog_sql_repo import SQLBlogRepository, SummaryRow
from app.schemas.blog import (
    ArticleCreate,
    ArticleDetail,
    ArticlesPage,
    ArticleSummary,
    ArticleUpdate,
    CommentCreate,
    CommentOut,
    CommentsPage,
    ReactionState,
)
from app.services.blog.images import ImageRejected, ImageStore, check_upload
from app.services.blog.recommend import Candidate, rank
from app.services.blog.slug import read_minutes, slugify, unique_slug

ARTICLE_NOT_FOUND = "Article introuvable."
COMMENT_NOT_FOUND = "Commentaire introuvable."
IMAGE_MISSING = "Image introuvable : envoyez-la de nouveau."
ALT_REQUIRED = "Ajoutez un texte alternatif qui décrit l’image."
# Fields that `null` clears in an update; for the others, `null` means "unchanged".
COVER_FIELDS = ("cover_image", "cover_alt")


class BlogError(HTTPException):
    pass


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _summary(row: SummaryRow) -> ArticleSummary:
    article, author_name, likes, comments = row
    return ArticleSummary(
        id=article.id,
        slug=article.slug,
        title=article.title,
        excerpt=article.excerpt,
        category=article.category,
        status=article.status,
        author_name=author_name or "",
        read_minutes=article.read_minutes,
        published_at=article.published_at,
        updated_at=article.updated_at,
        like_count=likes,
        comment_count=comments,
        cover_image=article.cover_image,
        cover_alt=article.cover_alt,
    )


def _comment(comment: BlogComment, author_name: str) -> CommentOut:
    return CommentOut(
        id=comment.id,
        article_id=comment.article_id,
        user_id=comment.user_id,
        author_name=author_name or "",
        body=comment.body,
        created_at=comment.created_at,
    )


def _not_found(detail: str = ARTICLE_NOT_FOUND) -> BlogError:
    return BlogError(status.HTTP_404_NOT_FOUND, detail)


class BlogService:
    def __init__(
        self,
        repo: SQLBlogRepository,
        now: Callable[[], datetime] = _utcnow,
        images: ImageStore | None = None,
    ) -> None:
        self.repo = repo
        self.now = now
        self.images = images or ImageStore(Path(settings.MEDIA_DIR))

    # ---------- lookups ----------

    async def _published(self, article_id: int) -> BlogArticle:
        article = await self.repo.get_article(article_id)
        if article is None or article.status != ARTICLE_PUBLISHED:
            raise _not_found()
        return article

    async def _published_by_slug(self, slug: str) -> BlogArticle:
        article = await self.repo.get_article_by_slug(slug)
        if article is None or article.status != ARTICLE_PUBLISHED:
            raise _not_found()
        return article

    async def _any(self, article_id: int) -> BlogArticle:
        article = await self.repo.get_article(article_id)
        if article is None:
            raise _not_found()
        return article

    async def _detail(self, article: BlogArticle) -> ArticleDetail:
        return ArticleDetail(
            id=article.id,
            slug=article.slug,
            title=article.title,
            excerpt=article.excerpt,
            category=article.category,
            status=article.status,
            author_name=await self.repo.author_name(article.author_id),
            read_minutes=article.read_minutes,
            published_at=article.published_at,
            updated_at=article.updated_at,
            like_count=await self.repo.like_count(article.id),
            comment_count=await self.repo.count_comments(article.id),
            cover_image=article.cover_image,
            cover_alt=article.cover_alt,
            body=article.body,
        )

    async def _summaries_by_ids(self, ids: list[int]) -> list[ArticleSummary]:
        return [_summary(row) for row in await self.repo.summaries_by_ids(ids)]

    # ---------- public reading ----------

    async def published(
        self, category: str | None, limit: int, offset: int
    ) -> ArticlesPage:
        rows = await self.repo.list_summaries(ARTICLE_PUBLISHED, category, limit, offset)
        total = await self.repo.count_articles(ARTICLE_PUBLISHED, category)
        return ArticlesPage(items=[_summary(r) for r in rows], total=total)

    async def article(self, slug: str) -> ArticleDetail:
        return await self._detail(await self._published_by_slug(slug))

    async def related(self, article_id: int, limit: int) -> list[ArticleSummary]:
        """Articles to read next, for every reader (not personalized: cacheable)."""
        article = await self._published(article_id)
        ids = rank(
            await self._candidates(),
            limit,
            self.now(),
            exclude_ids=[article.id],
            current_category=article.category,
        )
        return await self._summaries_by_ids(ids)

    async def comments(self, article_id: int, limit: int, offset: int) -> CommentsPage:
        await self._published(article_id)
        rows = await self.repo.list_comments(article_id, limit, offset)
        total = await self.repo.count_comments(article_id)
        return CommentsPage(items=[_comment(c, name) for c, name in rows], total=total)

    async def _candidates(self) -> list[Candidate]:
        return [
            Candidate(id=i, category=c, likes=n, published_at=p)
            for i, c, n, p in await self.repo.candidates()
        ]

    # ---------- logged-in readers ----------

    async def reactions(self, user: User, article_id: int) -> ReactionState:
        await self._published(article_id)
        return await self._reaction_state(user, article_id)

    async def _reaction_state(self, user: User, article_id: int) -> ReactionState:
        return ReactionState(
            liked=await self.repo.has_reaction(BlogLike, user.id, article_id),
            favorited=await self.repo.has_reaction(BlogFavorite, user.id, article_id),
            like_count=await self.repo.like_count(article_id),
        )

    async def set_like(self, user: User, article_id: int, liked: bool) -> ReactionState:
        return await self._set_reaction(BlogLike, user, article_id, liked)

    async def set_favorite(self, user: User, article_id: int, favorited: bool) -> ReactionState:
        return await self._set_reaction(BlogFavorite, user, article_id, favorited)

    async def _set_reaction(self, model, user: User, article_id: int, on: bool) -> ReactionState:
        """Idempotent: liking twice keeps one like, unliking twice is fine."""
        await self._published(article_id)
        if on:
            await self.repo.add_reaction(model, user.id, article_id)
        else:
            await self.repo.remove_reaction(model, user.id, article_id)
        return await self._reaction_state(user, article_id)

    async def add_comment(self, user: User, article_id: int, data: CommentCreate) -> CommentOut:
        await self._published(article_id)
        comment = BlogComment(article_id=article_id, user_id=user.id, body=data.body)
        await self.repo.add(comment)
        await self.repo.commit()
        return _comment(comment, user.full_name)

    async def delete_comment(self, user: User, comment_id: int) -> None:
        comment = await self.repo.get_comment(comment_id)
        if comment is None:
            raise _not_found(COMMENT_NOT_FOUND)
        if comment.user_id != user.id and user.role not in EDITORIAL_ROLES:
            raise BlogError(
                status.HTTP_403_FORBIDDEN, "Tu ne peux supprimer que tes propres commentaires."
            )
        await self.repo.delete(comment)
        await self.repo.commit()

    async def favorites(self, user: User) -> list[ArticleSummary]:
        """The user's saved articles, last saved first (unpublished ones hidden)."""
        ids = await self.repo.reacted_article_ids(BlogFavorite, user.id)
        return await self._summaries_by_ids(ids)

    async def recommendations(self, user: User, limit: int) -> list[ArticleSummary]:
        """Personalized: favors the categories the user liked or saved."""
        liked = await self.repo.reacted_article_ids(BlogLike, user.id)
        saved = await self.repo.reacted_article_ids(BlogFavorite, user.id)
        preferred = await self.repo.categories_of(list({*liked, *saved}))
        ids = rank(
            await self._candidates(),
            limit,
            self.now(),
            exclude_ids=saved,  # already in their favorites
            preferred_categories=preferred,
            liked_ids=liked,
        )
        return await self._summaries_by_ids(ids)

    # ---------- editors and admins ----------

    async def manage_list(self, status_filter: str | None, limit: int, offset: int) -> ArticlesPage:
        rows = await self.repo.list_summaries(status_filter, None, limit, offset)
        total = await self.repo.count_articles(status_filter)
        return ArticlesPage(items=[_summary(r) for r in rows], total=total)

    async def manage_get(self, article_id: int) -> ArticleDetail:
        return await self._detail(await self._any(article_id))

    async def upload_image(self, data: bytes, content_type: str | None) -> str:
        """Checks and stores an image; its key is then sent with the article."""
        try:
            check_upload(data, content_type)
            # Decoding and resizing take CPU time: off the event loop.
            key = await asyncio.to_thread(self.images.save, data)
        except ImageRejected as exc:
            raise BlogError(exc.status_code, str(exc)) from exc
        await self._purge_unused_images(also_keep=key)
        return key

    async def _purge_unused_images(self, also_keep: str | None = None) -> None:
        """Housekeeping, on each editorial change: deletes the images unused
        for a day (replaced, removed, or uploaded and never saved)."""
        keep = await self.repo.cover_keys()
        if also_keep:
            keep.add(also_keep)
        await asyncio.to_thread(self.images.purge_orphans, keep)

    def _checked_cover(
        self, key: str | None, alt: str | None, is_new: bool
    ) -> tuple[str | None, str | None]:
        """The (image, alt) pair to save: both set, or both empty."""
        if key is None:
            return None, None
        if is_new and not self.images.exists(key):
            raise BlogError(status.HTTP_422_UNPROCESSABLE_CONTENT, IMAGE_MISSING)
        if not alt:
            raise BlogError(status.HTTP_422_UNPROCESSABLE_CONTENT, ALT_REQUIRED)
        return key, alt

    async def _release_cover(self, key: str | None) -> None:
        """A cover no article uses anymore stays a day (pages cached by Next
        still show it), then goes with the next purge."""
        if key and not await self.repo.cover_in_use(key):
            await asyncio.to_thread(self.images.retire, key)
        await self._purge_unused_images()

    async def create(self, author: User, data: ArticleCreate) -> ArticleDetail:
        cover_image, cover_alt = self._checked_cover(
            data.cover_image, data.cover_alt, is_new=True
        )
        now = self.now()
        taken = await self.repo.slugs_starting_with(slugify(data.title))
        article = BlogArticle(
            slug=unique_slug(data.title, taken),
            title=data.title,
            excerpt=data.excerpt,
            body=data.body,
            category=data.category,
            status=data.status,
            author_id=author.id,
            read_minutes=read_minutes(data.body),
            created_at=now,
            updated_at=now,
            published_at=now if data.status == ARTICLE_PUBLISHED else None,
            cover_image=cover_image,
            cover_alt=cover_alt,
        )
        await self.repo.add(article)
        await self.repo.commit()
        return await self._detail(article)

    async def update(self, article_id: int, data: ArticleUpdate) -> ArticleDetail:
        article = await self._any(article_id)
        changes = data.model_dump(exclude_unset=True)
        old_cover = article.cover_image
        cover_image = changes.get("cover_image", old_cover)
        # Checked before anything changes: a refused update leaves the article as is.
        cover_image, cover_alt = self._checked_cover(
            cover_image,
            changes.get("cover_alt", article.cover_alt),
            is_new=cover_image != old_cover,
        )
        for field, value in changes.items():
            if value is not None and field not in COVER_FIELDS:
                setattr(article, field, value)
        article.cover_image, article.cover_alt = cover_image, cover_alt
        if "body" in changes:
            article.read_minutes = read_minutes(article.body)
        now = self.now()
        if article.status == ARTICLE_PUBLISHED and article.published_at is None:
            article.published_at = now
        article.updated_at = now
        await self.repo.add(article)
        await self.repo.commit()
        if old_cover != article.cover_image:
            await self._release_cover(old_cover)
        return await self._detail(article)

    async def delete(self, article_id: int) -> None:
        article = await self._any(article_id)
        cover = article.cover_image
        await self.repo.delete_article(article)
        await self.repo.commit()
        await self._release_cover(cover)
