from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.controllers.auth_controller import get_verification_service
from app.dependencies.auth import get_current_user
from app.main import app
from app.models.user import User

USER = User(id=7, full_name="Test", email="t@example.com")


@pytest.fixture
def service():
    mock = AsyncMock()
    app.dependency_overrides[get_verification_service] = lambda: mock
    return mock


@pytest.fixture
def logged_in(service):
    app.dependency_overrides[get_current_user] = lambda: USER


class TestSendLink:
    async def test_requires_login(self, client, service):
        response = await client.post("/auth/email-verification")
        assert response.status_code == 401
        service.send_link.assert_not_awaited()

    async def test_sends_the_link(self, client, logged_in, service):
        service.send_link.return_value = True
        response = await client.post("/auth/email-verification")
        assert response.status_code == 202
        assert response.json() == {"email_verified": False}
        service.send_link.assert_awaited_once_with(USER)

    async def test_says_when_the_address_is_already_confirmed(self, client, logged_in, service):
        service.send_link.return_value = False
        response = await client.post("/auth/email-verification")
        assert response.json() == {"email_verified": True}

    async def test_passes_on_the_cooldown(self, client, logged_in, service):
        service.send_link.side_effect = HTTPException(429, "Un e-mail vient d'être envoyé.")
        response = await client.post("/auth/email-verification")
        assert response.status_code == 429
        assert response.json()["detail"] == "Un e-mail vient d'être envoyé."


class TestConfirm:
    async def test_works_without_a_login(self, client, service):
        response = await client.post("/auth/email-verification/confirm", json={"token": "abc"})
        assert response.status_code == 200
        assert response.json() == {"email_verified": True}
        service.confirm.assert_awaited_once_with("abc")

    async def test_passes_on_an_invalid_link(self, client, service):
        service.confirm.side_effect = HTTPException(400, "Lien invalide ou expiré.")
        response = await client.post("/auth/email-verification/confirm", json={"token": "abc"})
        assert response.status_code == 400

    @pytest.mark.parametrize("body", [{}, {"token": ""}])
    async def test_rejects_a_missing_token(self, client, service, body):
        response = await client.post("/auth/email-verification/confirm", json=body)
        assert response.status_code == 422
