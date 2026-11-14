from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import Subquery, delete, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import defer

from app.models.blog import (
    ARTICLE_PUBLISHED,
    BlogArticle,
    BlogComment,
    BlogFavorite,
    BlogLike,
)
from app.models.user import User

# One row of a list: the article (body not loaded), its author's name, its counts.
SummaryRow = tuple[BlogArticle, str, int, int]
Reaction = type[BlogLike] | type[BlogFavorite]


def _count_by_article(model: Reaction | type[BlogComment]) -> Subquery:
    return (
        select(model.article_id, func.count().label("n"))
        .group_by(model.article_id)
        .subquery()
    )


class SQLBlogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def commit(self) -> None:
        await self.session.commit()

    async def add(self, row) -> None:
        self.session.add(row)
        await self.session.flush()

    # ---------- articles ----------

    async def get_article(self, article_id: int) -> BlogArticle | None:
        return await self.session.get(BlogArticle, article_id)

    async def get_article_by_slug(self, slug: str) -> BlogArticle | None:
        result = await self.session.execute(select(BlogArticle).where(BlogArticle.slug == slug))
        return result.scalars().one_or_none()

    async def slugs_starting_with(self, base: str) -> list[str]:
        result = await self.session.execute(
            select(BlogArticle.slug).where(
                or_(BlogArticle.slug == base, BlogArticle.slug.like(f"{base}-%"))
            )
        )
        return list(result.scalars().all())

    async def author_name(self, user_id: int) -> str:
        result = await self.session.execute(select(User.full_name).where(User.id == user_id))
        return result.scalar_one_or_none() or ""

    def _summaries(self):
        likes = _count_by_article(BlogLike)
        comments = _count_by_article(BlogComment)
        return (
            select(
                BlogArticle,
                User.full_name,
                func.coalesce(likes.c.n, 0),
                func.coalesce(comments.c.n, 0),
            )
            .options(defer(BlogArticle.body))
            .join(User, User.id == BlogArticle.author_id)
            .outerjoin(likes, likes.c.article_id == BlogArticle.id)
            .outerjoin(comments, comments.c.article_id == BlogArticle.id)
        )

    @staticmethod
    def _filtered(statement, status: str | None, category: str | None):
        if status is not None:
            statement = statement.where(BlogArticle.status == status)
        if category is not None:
            statement = statement.where(BlogArticle.category == category)
        return statement

    async def list_summaries(
        self,
        status: str | None = None,
        category: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[SummaryRow]:
        """Published lists go newest first; the editors' list by last edit."""
        order = (
            (BlogArticle.published_at.desc(), BlogArticle.id.desc())
            if status == ARTICLE_PUBLISHED
            else (BlogArticle.updated_at.desc(), BlogArticle.id.desc())
        )
        statement = self._filtered(self._summaries(), status, category)
        result = await self.session.execute(
            statement.order_by(*order).limit(limit).offset(offset)
        )
        return [tuple(row) for row in result.all()]

    async def count_articles(self, status: str | None = None, category: str | None = None) -> int:
        statement = self._filtered(select(func.count()).select_from(BlogArticle), status, category)
        result = await self.session.execute(statement)
        return result.scalar_one()

    async def summaries_by_ids(self, ids: Sequence[int]) -> list[SummaryRow]:
        """Published articles among `ids`, in the order of `ids`."""
        if not ids:
            return []
        result = await self.session.execute(
            self._summaries().where(
                BlogArticle.id.in_(ids), BlogArticle.status == ARTICLE_PUBLISHED
            )
        )
        rows = {row[0].id: tuple(row) for row in result.all()}
        return [rows[i] for i in ids if i in rows]

    async def candidates(self, limit: int = 200) -> list[tuple[int, str, int, datetime]]:
        """(id, category, likes, published_at) of the latest published articles."""
        likes = _count_by_article(BlogLike)
        result = await self.session.execute(
            select(
                BlogArticle.id,
                BlogArticle.category,
                func.coalesce(likes.c.n, 0),
                BlogArticle.published_at,
            )
            .outerjoin(likes, likes.c.article_id == BlogArticle.id)
            .where(BlogArticle.status == ARTICLE_PUBLISHED)
            .order_by(BlogArticle.published_at.desc())
            .limit(limit)
        )
        return [tuple(row) for row in result.all()]

    async def cover_keys(self) -> set[str]:
        """Keys of every image used as a cover, drafts included."""
        result = await self.session.execute(
            select(BlogArticle.cover_image).where(BlogArticle.cover_image.is_not(None))
        )
        return set(result.scalars().all())

    async def cover_in_use(self, key: str) -> bool:
        result = await self.session.execute(
            select(BlogArticle.id).where(BlogArticle.cover_image == key).limit(1)
        )
        return result.first() is not None

    async def delete_article(self, article: BlogArticle) -> None:
        """The article and everything attached to it (SQLite doesn't cascade)."""
        for model in (BlogComment, BlogLike, BlogFavorite):
            await self.session.execute(delete(model).where(model.article_id == article.id))
        await self.session.delete(article)

    # ---------- likes and favorites ----------

    async def has_reaction(self, model: Reaction, user_id: int, article_id: int) -> bool:
        result = await self.session.execute(
            select(model.id).where(model.user_id == user_id, model.article_id == article_id)
        )
        return result.first() is not None

    async def add_reaction(self, model: Reaction, user_id: int, article_id: int) -> None:
        """Idempotent: a second like (e.g. a double click racing) is ignored."""
        if await self.has_reaction(model, user_id, article_id):
            return
        self.session.add(model(user_id=user_id, article_id=article_id))
        try:
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()

    async def remove_reaction(self, model: Reaction, user_id: int, article_id: int) -> None:
        await self.session.execute(
            delete(model).where(model.user_id == user_id, model.article_id == article_id)
        )
        await self.session.commit()

    async def like_count(self, article_id: int) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(BlogLike).where(BlogLike.article_id == article_id)
        )
        return result.scalar_one()

    async def reacted_article_ids(self, model: Reaction, user_id: int) -> list[int]:
        """Ids of the articles the user liked (or saved), most recent first."""
        result = await self.session.execute(
            select(model.article_id)
            .where(model.user_id == user_id)
            .order_by(model.created_at.desc(), model.id.desc())
        )
        return list(result.scalars().all())

    async def categories_of(self, article_ids: Sequence[int]) -> set[str]:
        if not article_ids:
            return set()
        result = await self.session.execute(
            select(BlogArticle.category).where(BlogArticle.id.in_(article_ids)).distinct()
        )
        return set(result.scalars().all())

    # ---------- comments ----------

    async def list_comments(
        self, article_id: int, limit: int, offset: int
    ) -> list[tuple[BlogComment, str]]:
        """Newest first, with the author's name."""
        result = await self.session.execute(
            select(BlogComment, User.full_name)
            .join(User, User.id == BlogComment.user_id)
            .where(BlogComment.article_id == article_id)
            .order_by(BlogComment.created_at.desc(), BlogComment.id.desc())
            .limit(limit)
            .offset(offset)
        )
        return [tuple(row) for row in result.all()]

    async def count_comments(self, article_id: int) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(BlogComment)
            .where(BlogComment.article_id == article_id)
        )
        return result.scalar_one()

    async def get_comment(self, comment_id: int) -> BlogComment | None:
        return await self.session.get(BlogComment, comment_id)

    async def delete(self, row) -> None:
        await self.session.delete(row)
