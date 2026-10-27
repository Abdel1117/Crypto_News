import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.controllers.chat_controller import get_chat_service, get_usage_repo
from app.core.config import settings
from app.dependencies.auth import get_current_user
from app.main import app
from app.models.user import User

BODY = {
    "messages": [{"role": "user", "content": "Prix du bitcoin ?"}],
    "currency": "eur",
    "watchlist": ["bitcoin"],
}


def parse_sse(text: str) -> list[dict]:
    return [
        json.loads(line[len("data: "):])
        for line in text.splitlines()
        if line.startswith("data: ")
    ]


@pytest.fixture
def repo():
    r = AsyncMock()
    r.get_count.return_value = 0
    r.increment.return_value = 1
    return r


@pytest.fixture
def service():
    async def stream_reply(turns, context):
        yield {"type": "text", "text": "Le bitcoin vaut 100 €."}
        yield {"type": "done"}

    s = MagicMock()
    s.stream_reply = MagicMock(side_effect=stream_reply)
    return s


@pytest.fixture(autouse=True)
def api_key(monkeypatch):
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "sk-test")


@pytest.fixture
def logged_in(repo, service):
    app.dependency_overrides[get_current_user] = lambda: User(
        id=7, full_name="Test", email="t@example.com"
    )
    app.dependency_overrides[get_usage_repo] = lambda: repo
    app.dependency_overrides[get_chat_service] = lambda: service


class TestPostChat:
    async def test_requires_login(self, client):
        response = await client.post("/chat", json=BODY)
        assert response.status_code == 401

    async def test_streams_the_answer(self, client, logged_in, repo, service):
        response = await client.post("/chat", json=BODY)

        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")
        assert response.headers["x-accel-buffering"] == "no"
        events = parse_sse(response.text)
        assert events[0] == {
            "type": "usage",
            "used": 1,
            "limit": settings.CHAT_DAILY_LIMIT,
            "remaining": settings.CHAT_DAILY_LIMIT - 1,
            "available": True,
        }
        assert events[1] == {"type": "text", "text": "Le bitcoin vaut 100 €."}
        assert events[-1] == {"type": "done"}
        repo.increment.assert_awaited_once()

        turns, context = service.stream_reply.call_args.args
        assert turns == [{"role": "user", "content": "Prix du bitcoin ?"}]
        assert '"bitcoin"' in context

    async def test_blocks_over_the_daily_limit(self, client, logged_in, repo, service):
        repo.get_count.return_value = settings.CHAT_DAILY_LIMIT
        response = await client.post("/chat", json=BODY)

        assert response.status_code == 429
        repo.increment.assert_not_called()
        service.stream_reply.assert_not_called()

    async def test_rejects_conversation_ending_with_assistant(self, client, logged_in, repo):
        body = {**BODY, "messages": [
            {"role": "user", "content": "a"}, {"role": "assistant", "content": "b"},
        ]}
        response = await client.post("/chat", json=body)
        assert response.status_code == 422
        repo.increment.assert_not_called()

    async def test_rejects_unknown_currency(self, client, logged_in):
        response = await client.post("/chat", json={**BODY, "currency": "gbp"})
        assert response.status_code == 422

    async def test_returns_503_without_api_key(self, client, repo, monkeypatch):
        monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
        app.dependency_overrides[get_current_user] = lambda: User(
            id=7, full_name="Test", email="t@example.com"
        )
        app.dependency_overrides[get_usage_repo] = lambda: repo
        response = await client.post("/chat", json=BODY)
        assert response.status_code == 503


class TestGetUsage:
    async def test_requires_login(self, client):
        response = await client.get("/chat/usage")
        assert response.status_code == 401

    async def test_returns_remaining_messages(self, client, logged_in, repo):
        repo.get_count.return_value = 4
        response = await client.get("/chat/usage")
        assert response.status_code == 200
        limit = settings.CHAT_DAILY_LIMIT
        assert response.json() == {
            "used": 4, "limit": limit, "remaining": limit - 4, "available": True,
        }

    async def test_reports_unavailable_without_api_key(self, client, logged_in, monkeypatch):
        monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
        response = await client.get("/chat/usage")
        assert response.status_code == 200
        assert response.json()["available"] is False
