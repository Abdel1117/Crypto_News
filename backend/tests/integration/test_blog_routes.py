from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest

from app.controllers.blog_controller import get_blog_service
from app.dependencies.auth import get_current_user
from app.main import app
from app.models.user import User
from app.schemas.blog import ArticleDetail, ArticlesPage, ReactionState
from app.services.blog.blog_service import BlogError

ARTICLE = ArticleDetail(
    id=3,
    slug="bitcoin-et-les-etf",
    title="Bitcoin et les ETF",
    excerpt="Un résumé assez long.",
    category="Bitcoin",
    status="published",
    author_name="Élise",
    read_minutes=4,
    published_at=datetime(2026, 11, 1, tzinfo=timezone.utc),
    updated_at=datetime(2026, 11, 1, tzinfo=timezone.utc),
    like_count=2,
    comment_count=1,
    body="## Hello",
)
VALID = {
    "title": "Un nouvel article",
    "excerpt": "Un résumé assez long pour passer.",
    "body": "Du contenu.",
    "category": "DeFi",
}


@pytest.fixture
def service():
    service = AsyncMock()
    app.dependency_overrides[get_blog_service] = lambda: service
    return service


def log_in(role="user"):
    user = User(id=7, full_name="Test", email="t@example.com", role=role)
    app.dependency_overrides[get_current_user] = lambda: user
    return user


class TestPublic:
    async def test_list_is_public(self, client, service):
        service.published.return_value = ArticlesPage(items=[ARTICLE], total=1)
        response = await client.get("/blog/articles?category=Bitcoin&limit=10")
        assert response.status_code == 200
        assert response.json()["items"][0]["slug"] == "bitcoin-et-les-etf"
        service.published.assert_awaited_once_with("Bitcoin", 10, 0)

    async def test_unknown_category_is_rejected(self, client, service):
        response = await client.get("/blog/articles?category=Poker")
        assert response.status_code == 422

    async def test_article_by_slug(self, client, service):
        service.article.return_value = ARTICLE
        response = await client.get("/blog/articles/bitcoin-et-les-etf")
        assert response.status_code == 200
        assert response.json()["body"] == "## Hello"
        assert response.json()["published_at"].endswith("Z")

    async def test_missing_or_draft_article_is_404(self, client, service):
        service.article.side_effect = BlogError(404, "Article introuvable.")
        response = await client.get("/blog/articles/brouillon")
        assert response.status_code == 404
        assert response.json()["detail"] == "Article introuvable."

    async def test_related_and_comments_are_public(self, client, service):
        service.related.return_value = [ARTICLE]
        service.comments.return_value = {"items": [], "total": 0}
        assert (await client.get("/blog/articles/3/related?limit=2")).status_code == 200
        assert (await client.get("/blog/articles/3/comments")).status_code == 200
        service.related.assert_awaited_once_with(3, 2)


class TestReaders:
    @pytest.mark.parametrize(
        "method,url",
        [
            ("get", "/blog/articles/3/me"),
            ("put", "/blog/articles/3/like"),
            ("delete", "/blog/articles/3/like"),
            ("put", "/blog/articles/3/favorite"),
            ("delete", "/blog/articles/3/favorite"),
            ("post", "/blog/articles/3/comments"),
            ("delete", "/blog/comments/1"),
            ("get", "/blog/favorites"),
            ("get", "/blog/recommendations"),
        ],
    )
    async def test_require_login(self, client, service, method, url):
        response = await getattr(client, method)(url)
        assert response.status_code == 401

    async def test_like_and_unlike(self, client, service):
        user = log_in()
        service.set_like.return_value = ReactionState(liked=True, favorited=False, like_count=3)
        response = await client.put("/blog/articles/3/like")
        assert response.json() == {"liked": True, "favorited": False, "like_count": 3}
        service.set_like.assert_awaited_once_with(user, 3, True)

        await client.delete("/blog/articles/3/like")
        service.set_like.assert_awaited_with(user, 3, False)

    async def test_favorite(self, client, service):
        user = log_in()
        service.set_favorite.return_value = ReactionState(liked=False, favorited=True, like_count=0)
        await client.put("/blog/articles/3/favorite")
        service.set_favorite.assert_awaited_once_with(user, 3, True)

    async def test_comment_is_validated(self, client, service):
        log_in()
        for body in ({"body": "   "}, {"body": "x" * 2001}, {}):
            response = await client.post("/blog/articles/3/comments", json=body)
            assert response.status_code == 422
        service.add_comment.assert_not_awaited()

    async def test_delete_comment(self, client, service):
        user = log_in()
        response = await client.delete("/blog/comments/5")
        assert response.status_code == 204
        service.delete_comment.assert_awaited_once_with(user, 5)

    async def test_favorites_and_recommendations(self, client, service):
        user = log_in()
        service.favorites.return_value = [ARTICLE]
        service.recommendations.return_value = []
        assert len((await client.get("/blog/favorites")).json()) == 1
        await client.get("/blog/recommendations?limit=4")
        service.recommendations.assert_awaited_once_with(user, 4)


class TestEditorial:
    @pytest.mark.parametrize(
        "method,url,body",
        [
            ("get", "/blog/manage/articles", None),
            ("get", "/blog/manage/articles/3", None),
            ("post", "/blog/manage/articles", VALID),
            ("patch", "/blog/manage/articles/3", {"status": "draft"}),
            ("delete", "/blog/manage/articles/3", None),
            ("post", "/blog/manage/images", None),
        ],
    )
    async def test_readers_are_refused(self, client, service, method, url, body):
        log_in("user")
        kwargs = {"json": body} if body else {}
        response = await client.request(method.upper(), url, **kwargs)
        assert response.status_code == 403

    async def test_logged_out_is_401(self, client, service):
        response = await client.post("/blog/manage/articles", json=VALID)
        assert response.status_code == 401

    @pytest.mark.parametrize("role", ["editor", "admin"])
    async def test_editors_and_admins_create(self, client, service, role):
        user = log_in(role)
        service.create.return_value = ARTICLE
        response = await client.post("/blog/manage/articles", json=VALID)
        assert response.status_code == 201
        author, data = service.create.await_args.args
        assert author is user
        assert (data.category, data.status) == ("DeFi", "draft")

    @pytest.mark.parametrize(
        "change",
        [
            {"category": "Poker"},
            {"title": "abc"},
            {"excerpt": "court"},
            {"status": "archived"},
            {"body": "x" * 50_001},
            {"cover_image": "../../etc/passwd", "cover_alt": "Une image"},
            {"cover_image": "a" * 32, "cover_alt": "  "},
            {"cover_image": "a" * 32, "cover_alt": "x" * 201},
        ],
    )
    async def test_invalid_articles_are_rejected(self, client, service, change):
        log_in("editor")
        response = await client.post("/blog/manage/articles", json={**VALID, **change})
        assert response.status_code == 422
        service.create.assert_not_awaited()

    async def test_update_sends_only_the_fields_given(self, client, service):
        log_in("editor")
        service.update.return_value = ARTICLE
        response = await client.patch("/blog/manage/articles/3", json={"status": "published"})
        assert response.status_code == 200
        article_id, data = service.update.await_args.args
        assert article_id == 3
        assert data.model_dump(exclude_unset=True) == {"status": "published"}

    async def test_list_filter_and_delete(self, client, service):
        log_in("admin")
        service.manage_list.return_value = ArticlesPage(items=[], total=0)
        await client.get("/blog/manage/articles?status=draft")
        service.manage_list.assert_awaited_once_with("draft", 50, 0)

        response = await client.delete("/blog/manage/articles/3")
        assert response.status_code == 204
        service.delete.assert_awaited_once_with(3)


class TestImageUpload:
    async def test_editor_uploads_an_image(self, client, service):
        log_in("editor")
        service.upload_image.return_value = "a" * 32
        response = await client.post(
            "/blog/manage/images", files={"file": ("photo.png", b"PNG...", "image/png")}
        )
        assert response.status_code == 201
        assert response.json() == {"key": "a" * 32}
        service.upload_image.assert_awaited_once_with(b"PNG...", "image/png")

    async def test_only_one_byte_over_the_limit_is_read(self, client, service):
        log_in("editor")
        service.upload_image.return_value = "a" * 32
        heavy = b"x" * (5 * 1024 * 1024 + 100)
        await client.post(
            "/blog/manage/images", files={"file": ("big.jpg", heavy, "image/jpeg")}
        )
        data, _ = service.upload_image.await_args.args
        assert len(data) == 5 * 1024 * 1024 + 1

    async def test_refusal_message_is_passed_on(self, client, service):
        log_in("admin")
        service.upload_image.side_effect = BlogError(415, "Format non accepté.")
        response = await client.post(
            "/blog/manage/images", files={"file": ("anim.gif", b"GIF89a", "image/gif")}
        )
        assert response.status_code == 415
        assert response.json()["detail"] == "Format non accepté."

    async def test_a_file_is_required(self, client, service):
        log_in("editor")
        response = await client.post("/blog/manage/images")
        assert response.status_code == 422
        service.upload_image.assert_not_awaited()

    async def test_cover_can_be_removed_with_null(self, client, service):
        log_in("editor")
        service.update.return_value = ARTICLE
        await client.patch("/blog/manage/articles/3", json={"cover_image": None})
        _, data = service.update.await_args.args
        assert data.model_dump(exclude_unset=True) == {"cover_image": None}
