from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlmodel import SQLModel

from app.models.blog import BlogComment, BlogFavorite, BlogLike
from app.models.user import User
from app.repositories.blog.blog_sql_repo import SQLBlogRepository
from app.schemas.blog import ArticleCreate, ArticleUpdate, CommentCreate
from app.services.blog.blog_service import BlogService

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


@pytest.fixture
def service(session):
    return BlogService(SQLBlogRepository(session), now=Clock())


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
