import time
from datetime import datetime, timedelta, timezone
from io import BytesIO

import pytest
from PIL import Image
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlmodel import SQLModel

from app.models.blog import BlogComment, BlogFavorite, BlogLike
from app.models.user import User
from app.repositories.blog.blog_sql_repo import SQLBlogRepository
from app.schemas.blog import ArticleCreate, ArticleUpdate, CommentCreate
from app.services.blog.blog_service import ALT_REQUIRED, IMAGE_MISSING, BlogService
from app.services.blog.images import ORPHAN_AGE_SECONDS, ImageStore

START = datetime(2026, 11, 1, tzinfo=timezone.utc)


class Clock:
    """Each call is one minute later: articles get distinct, ordered dates."""

    def __init__(self):
        self.value = START

    def __call__(self):
        self.value += timedelta(minutes=1)
        return self.value


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite://")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    async with AsyncSession(engine, expire_on_commit=False) as s:
        yield s
    await engine.dispose()


@pytest.fixture
async def people(session):
    rows = {
        "editor": User(full_name="Élise Éditrice", email="editor@example.com", role="editor"),
        "admin": User(full_name="Adam Admin", email="admin@example.com", role="admin"),
        "reader": User(full_name="Rémi Lecteur", email="reader@example.com"),
        "other": User(full_name="Olga Lectrice", email="other@example.com"),
    }
    session.add_all(rows.values())
    await session.commit()
    return rows


class FileClock:
    """Real time, plus whatever the test has skipped ahead."""

    def __init__(self):
        self.skipped = 0.0

    def __call__(self):
        return time.time() + self.skipped


@pytest.fixture
def images(tmp_path):
    return ImageStore(tmp_path, clock=FileClock())


async def a_day_later(service, images):
    """A day passes, then an editor uploads an image (which purges)."""
    images.clock.skipped += ORPHAN_AGE_SECONDS + 60
    return await service.upload_image(jpeg(), "image/jpeg")


@pytest.fixture
def service(session, images):
    return BlogService(SQLBlogRepository(session), now=Clock(), images=images)


def draft(title="Bitcoin et les ETF spot", category="Bitcoin", status="draft", body=None):
    return ArticleCreate(
        title=title,
        excerpt="Un résumé assez long pour passer.",
        body=body or "## Titre\n\nDu **Markdown**.",
        category=category,
        status=status,
    )


async def publish(service, people, title="Bitcoin et les ETF spot", category="Bitcoin"):
    return await service.create(people["editor"], draft(title, category, "published"))


async def count(session, model):
    return (await session.execute(select(func.count()).select_from(model))).scalar_one()


class TestWriting:
    async def test_create_sets_slug_author_and_reading_time(self, service, people):
        article = await service.create(people["editor"], draft(body="mot " * 450))
        assert article.slug == "bitcoin-et-les-etf-spot"
        assert article.author_name == "Élise Éditrice"
        assert article.read_minutes == 2
        assert article.status == "draft"
        assert article.published_at is None

    async def test_same_title_gets_a_new_slug(self, service, people):
        first = await service.create(people["editor"], draft())
        second = await service.create(people["admin"], draft())
        assert (first.slug, second.slug) == ("bitcoin-et-les-etf-spot", "bitcoin-et-les-etf-spot-2")

    async def test_publishing_sets_the_date_once(self, service, people):
        article = await service.create(people["editor"], draft())
        published = await service.update(article.id, ArticleUpdate(status="published"))
        assert published.published_at is not None

        unpublished = await service.update(article.id, ArticleUpdate(status="draft"))
        republished = await service.update(article.id, ArticleUpdate(status="published"))
        assert unpublished.published_at == published.published_at
        assert republished.published_at == published.published_at

    async def test_update_changes_only_what_is_sent_and_keeps_the_slug(self, service, people):
        article = await service.create(people["editor"], draft())
        updated = await service.update(
            article.id, ArticleUpdate(title="Un tout autre titre", body="mot " * 1000)
        )
        assert updated.title == "Un tout autre titre"
        assert updated.slug == article.slug
        assert updated.category == "Bitcoin"
        assert updated.read_minutes == 5

    async def test_update_or_delete_unknown_article(self, service, people):
        for call in (service.update(99, ArticleUpdate(title="Titre valide")), service.delete(99)):
            with pytest.raises(HTTPException) as exc:
                await call
            assert exc.value.status_code == 404

    async def test_delete_removes_comments_likes_and_favorites(self, service, people, session):
        article = await publish(service, people)
        reader = people["reader"]
        await service.set_like(reader, article.id, True)
        await service.set_favorite(reader, article.id, True)
        await service.add_comment(reader, article.id, CommentCreate(body="Merci !"))

        await service.delete(article.id)

        for model in (BlogComment, BlogLike, BlogFavorite):
            assert await count(session, model) == 0
        assert (await service.manage_list(None, 50, 0)).total == 0

    async def test_manage_list_has_drafts_and_filters(self, service, people):
        await service.create(people["editor"], draft("Un brouillon en cours"))
        await publish(service, people, "Un article publié")
        assert (await service.manage_list(None, 50, 0)).total == 2
        drafts = await service.manage_list("draft", 50, 0)
        assert [a.title for a in drafts.items] == ["Un brouillon en cours"]

    async def test_manage_get_returns_drafts_with_body(self, service, people):
        article = await service.create(people["editor"], draft())
        detail = await service.manage_get(article.id)
        assert detail.body.startswith("## Titre")


class TestReading:
    async def test_drafts_are_hidden_from_readers(self, service, people):
        article = await service.create(people["editor"], draft())
        with pytest.raises(HTTPException) as exc:
            await service.article(article.slug)
        assert exc.value.status_code == 404
        assert (await service.published(None, 30, 0)).total == 0
        for call in (
            service.comments(article.id, 20, 0),
            service.related(article.id, 3),
            service.set_like(people["reader"], article.id, True),
            service.add_comment(people["reader"], article.id, CommentCreate(body="Hello")),
        ):
            with pytest.raises(HTTPException):
                await call

    async def test_published_list_newest_first_with_counts(self, service, people):
        older = await publish(service, people, "Le plus ancien article")
        newer = await publish(service, people, "Le plus récent article", "DeFi")
        await service.set_like(people["reader"], older.id, True)
        await service.add_comment(people["reader"], older.id, CommentCreate(body="Top"))

        page = await service.published(None, 30, 0)
        assert [a.id for a in page.items] == [newer.id, older.id]
        assert (page.items[1].like_count, page.items[1].comment_count) == (1, 1)
        assert page.items[0].published_at.tzinfo is not None

        defi = await service.published("DeFi", 30, 0)
        assert [a.id for a in defi.items] == [newer.id]

    async def test_article_by_slug(self, service, people):
        article = await publish(service, people)
        detail = await service.article(article.slug)
        assert detail.id == article.id
        assert "Markdown" in detail.body

    async def test_related_prefers_the_same_category(self, service, people):
        current = await publish(service, people, "Article Bitcoin courant")
        same = await publish(service, people, "Un autre article Bitcoin")
        await publish(service, people, "Un article DeFi récent", "DeFi")

        related = await service.related(current.id, 1)
        assert [a.id for a in related] == [same.id]


class TestReactions:
    async def test_like_is_idempotent(self, service, people):
        article = await publish(service, people)
        reader = people["reader"]
        await service.set_like(reader, article.id, True)
        state = await service.set_like(reader, article.id, True)
        assert (state.liked, state.like_count) == (True, 1)

        state = await service.set_like(reader, article.id, False)
        state = await service.set_like(reader, article.id, False)
        assert (state.liked, state.like_count) == (False, 0)

    async def test_reactions_of_one_reader(self, service, people):
        article = await publish(service, people)
        await service.set_like(people["other"], article.id, True)
        await service.set_favorite(people["reader"], article.id, True)

        state = await service.reactions(people["reader"], article.id)
        assert (state.liked, state.favorited, state.like_count) == (False, True, 1)

    async def test_favorites_last_saved_first_and_published_only(self, service, people):
        first = await publish(service, people, "Premier article sauvé")
        second = await publish(service, people, "Second article sauvé")
        reader = people["reader"]
        await service.set_favorite(reader, first.id, True)
        await service.set_favorite(reader, second.id, True)
        assert [a.id for a in await service.favorites(reader)] == [second.id, first.id]

        await service.update(second.id, ArticleUpdate(status="draft"))
        assert [a.id for a in await service.favorites(reader)] == [first.id]

    async def test_recommendations_follow_the_reader_tastes(self, service, people):
        liked = await publish(service, people, "Un article DeFi aimé", "DeFi")
        defi = await publish(service, people, "Un autre article DeFi", "DeFi")
        await publish(service, people, "Un article NFT", "NFT")
        saved = await publish(service, people, "Un article déjà sauvé", "Bitcoin")
        reader = people["reader"]
        await service.set_like(reader, liked.id, True)
        await service.set_favorite(reader, saved.id, True)

        ids = [a.id for a in await service.recommendations(reader, 2)]
        assert ids[0] == defi.id
        assert saved.id not in ids


class TestComments:
    async def test_add_and_list_newest_first(self, service, people):
        article = await publish(service, people)
        await service.add_comment(people["reader"], article.id, CommentCreate(body="Premier"))
        await service.add_comment(people["other"], article.id, CommentCreate(body="Second"))

        page = await service.comments(article.id, 20, 0)
        assert page.total == 2
        assert [c.body for c in page.items] == ["Second", "Premier"]
        assert page.items[1].author_name == "Rémi Lecteur"

    @pytest.mark.parametrize("who", ["reader", "editor", "admin"])
    async def test_author_editors_and_admins_can_delete(self, service, people, who):
        article = await publish(service, people)
        comment = await service.add_comment(
            people["reader"], article.id, CommentCreate(body="À supprimer")
        )
        await service.delete_comment(people[who], comment.id)
        assert (await service.comments(article.id, 20, 0)).total == 0

    async def test_other_readers_cannot_delete(self, service, people):
        article = await publish(service, people)
        comment = await service.add_comment(people["reader"], article.id, CommentCreate(body="Mien"))
        with pytest.raises(HTTPException) as exc:
            await service.delete_comment(people["other"], comment.id)
        assert exc.value.status_code == 403

    async def test_unknown_comment(self, service, people):
        with pytest.raises(HTTPException) as exc:
            await service.delete_comment(people["admin"], 404)
        assert exc.value.status_code == 404


def jpeg() -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (1200, 630), "navy").save(buffer, "JPEG")
    return buffer.getvalue()


async def expect_error(call, status_code, detail=None):
    with pytest.raises(HTTPException) as exc:
        await call
    assert exc.value.status_code == status_code
    if detail:
        assert exc.value.detail == detail


class TestCoverImage:
    async def test_upload_returns_a_key_for_the_article(self, service, images):
        key = await service.upload_image(jpeg(), "image/jpeg")
        assert images.exists(key)

    async def test_refused_uploads(self, service, images):
        await expect_error(service.upload_image(jpeg(), "image/gif"), 415)
        await expect_error(service.upload_image(b"x" * (5 * 1024 * 1024 + 1), "image/png"), 413)
        await expect_error(service.upload_image(b"pas une image", "image/png"), 422)
        assert not images.dir.exists() or not any(images.dir.iterdir())

    async def test_create_with_cover_and_alt(self, service, people):
        key = await service.upload_image(jpeg(), "image/jpeg")
        data = draft().model_copy(update={"cover_image": key, "cover_alt": "Un graphique"})
        article = await service.create(people["editor"], data)
        assert (article.cover_image, article.cover_alt) == (key, "Un graphique")
        listed = (await service.manage_list(None, 50, 0)).items[0]
        assert (listed.cover_image, listed.cover_alt) == (key, "Un graphique")

    async def test_an_image_needs_its_alt(self, service, people):
        key = await service.upload_image(jpeg(), "image/jpeg")
        data = draft().model_copy(update={"cover_image": key})
        await expect_error(service.create(people["editor"], data), 422, ALT_REQUIRED)

    async def test_unknown_image_is_refused(self, service, people):
        data = draft().model_copy(update={"cover_image": "0" * 32, "cover_alt": "Un graphique"})
        await expect_error(service.create(people["editor"], data), 422, IMAGE_MISSING)

    async def test_alt_without_image_is_dropped(self, service, people):
        data = draft().model_copy(update={"cover_alt": "Rien à décrire"})
        article = await service.create(people["editor"], data)
        assert (article.cover_image, article.cover_alt) == (None, None)

    async def _with_cover(self, service, people):
        key = await service.upload_image(jpeg(), "image/jpeg")
        data = draft().model_copy(update={"cover_image": key, "cover_alt": "Première image"})
        return await service.create(people["editor"], data), key

    async def test_other_updates_keep_the_cover(self, service, people):
        article, key = await self._with_cover(service, people)
        updated = await service.update(article.id, ArticleUpdate(title="Un autre titre"))
        assert (updated.cover_image, updated.cover_alt) == (key, "Première image")

    async def test_alt_alone_can_change(self, service, people, images):
        article, key = await self._with_cover(service, people)
        updated = await service.update(article.id, ArticleUpdate(cover_alt="Nouvelle description"))
        assert (updated.cover_image, updated.cover_alt) == (key, "Nouvelle description")
        assert images.exists(key)

    async def test_alt_cannot_be_removed_while_there_is_an_image(self, service, people):
        article, _ = await self._with_cover(service, people)
        await expect_error(
            service.update(article.id, ArticleUpdate(cover_alt=None)), 422, ALT_REQUIRED
        )

    async def test_replaced_image_is_deleted_a_day_later(self, service, people, images):
        article, old = await self._with_cover(service, people)
        new = await service.upload_image(jpeg(), "image/jpeg")
        updated = await service.update(
            article.id, ArticleUpdate(cover_image=new, cover_alt="Deuxième image")
        )
        assert (updated.cover_image, updated.cover_alt) == (new, "Deuxième image")
        # Still there for the pages Next has cached with the old image.
        assert images.exists(old)

        await a_day_later(service, images)
        assert not images.exists(old)
        assert images.exists(new)

    async def test_null_removes_the_cover(self, service, people, images):
        article, key = await self._with_cover(service, people)
        updated = await service.update(article.id, ArticleUpdate(cover_image=None))
        assert (updated.cover_image, updated.cover_alt) == (None, None)
        await a_day_later(service, images)
        assert not images.exists(key)

    async def test_images_never_saved_are_deleted_a_day_later(self, service, people, images):
        article, used = await self._with_cover(service, people)
        abandoned = await service.upload_image(jpeg(), "image/jpeg")
        await a_day_later(service, images)
        assert not images.exists(abandoned)
        assert images.exists(used)

    async def test_refused_update_changes_nothing(self, service, people, images):
        article, key = await self._with_cover(service, people)
        await expect_error(
            service.update(
                article.id,
                ArticleUpdate(title="Titre jamais enregistré", cover_image="f" * 32),
            ),
            422,
            IMAGE_MISSING,
        )
        current = await service.manage_get(article.id)
        assert (current.title, current.cover_image) == (article.title, key)

    async def test_deleting_the_article_deletes_its_cover(self, service, people, images):
        article, key = await self._with_cover(service, people)
        await service.delete(article.id)
        await a_day_later(service, images)
        assert not images.exists(key)

    async def test_a_cover_shared_by_two_articles_is_kept(self, service, people, images):
        article, key = await self._with_cover(service, people)
        data = draft("Un second article").model_copy(
            update={"cover_image": key, "cover_alt": "Même image"}
        )
        await service.create(people["editor"], data)
        await service.delete(article.id)
        await a_day_later(service, images)
        assert images.exists(key)
