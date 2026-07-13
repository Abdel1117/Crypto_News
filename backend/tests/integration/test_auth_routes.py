from datetime import datetime

import pytest
from fastapi import HTTPException, status
from unittest.mock import AsyncMock

from app.main import app
from app.controllers.auth_controller import get_auth_service
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.token import TokenPair


def make_user(**overrides):
    base = dict(
        id=1,
        full_name="Test User",
        email="test@example.com",
        hashed_password="hashed",
        is_active=True,
        created_at=datetime(2024, 1, 1),
    )
    base.update(overrides)
    return User(**base)


def make_token_pair(**overrides):
    base = dict(
        access_token="access_token_value",
        refresh_token="refresh_token_value",
        token_type="bearer",
        expires_in=86400,
    )
    base.update(overrides)
    return TokenPair(**base)


REGISTER_PAYLOAD = {
    "fullname": "Test User",
    "email": "test@example.com",
    "password": "password123",
}

LOGIN_PAYLOAD = {
    "email": "test@example.com",
    "password": "password123",
}


class TestRegisterRoute:
    async def test_returns_201_on_success(self, client):
        mock_service = AsyncMock()
        mock_service.register_user.return_value = make_user()
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        response = await client.post("/auth/register", json=REGISTER_PAYLOAD)
        assert response.status_code == 201

    async def test_response_contains_user_fields(self, client):
        mock_service = AsyncMock()
        mock_service.register_user.return_value = make_user()
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        body = (await client.post("/auth/register", json=REGISTER_PAYLOAD)).json()
        assert body["email"] == "test@example.com"
        assert body["full_name"] == "Test User"
        assert body["is_active"] is True
        assert "id" in body

    async def test_returns_400_on_duplicate_email(self, client):
        mock_service = AsyncMock()
        mock_service.register_user.side_effect = HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte existe déjà pour cette adresse e-mail.",
        )
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        response = await client.post("/auth/register", json=REGISTER_PAYLOAD)
        assert response.status_code == 400
        assert "déjà" in response.json()["detail"]

    async def test_returns_422_when_password_too_short(self, client):
        payload = {**REGISTER_PAYLOAD, "password": "short"}
        response = await client.post("/auth/register", json=payload)
        assert response.status_code == 422

    async def test_returns_422_when_email_invalid(self, client):
        payload = {**REGISTER_PAYLOAD, "email": "not-an-email"}
        response = await client.post("/auth/register", json=payload)
        assert response.status_code == 422

    async def test_returns_422_when_fullname_missing(self, client):
        payload = {"email": "test@example.com", "password": "password123"}
        response = await client.post("/auth/register", json=payload)
        assert response.status_code == 422


class TestLoginRoute:
    async def test_returns_200_on_success(self, client):
        mock_service = AsyncMock()
        mock_service.login.return_value = make_token_pair()
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        response = await client.post("/auth/login", json=LOGIN_PAYLOAD)
        assert response.status_code == 200

    async def test_response_body_contains_access_token(self, client):
        mock_service = AsyncMock()
        mock_service.login.return_value = make_token_pair()
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        body = (await client.post("/auth/login", json=LOGIN_PAYLOAD)).json()
        assert body["access_token"] == "access_token_value"
        assert body["token_type"] == "bearer"
        assert "expires_in" in body

    async def test_response_does_not_expose_refresh_token_in_body(self, client):
        mock_service = AsyncMock()
        mock_service.login.return_value = make_token_pair()
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        body = (await client.post("/auth/login", json=LOGIN_PAYLOAD)).json()
        assert "refresh_token" not in body

    async def test_sets_httponly_refresh_cookie(self, client):
        mock_service = AsyncMock()
        mock_service.login.return_value = make_token_pair()
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        response = await client.post("/auth/login", json=LOGIN_PAYLOAD)
        assert "refresh_token" in response.cookies

    async def test_returns_401_on_wrong_credentials(self, client):
        mock_service = AsyncMock()
        mock_service.login.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
        )
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        response = await client.post("/auth/login", json=LOGIN_PAYLOAD)
        assert response.status_code == 401

    async def test_returns_422_when_email_invalid(self, client):
        response = await client.post(
            "/auth/login", json={"email": "bad", "password": "any"}
        )
        assert response.status_code == 422


class TestRefreshRoute:
    async def test_returns_401_when_cookie_missing(self, client):
        response = await client.post("/auth/refresh")
        assert response.status_code == 401

    async def test_401_detail_mentions_missing_token(self, client):
        body = (await client.post("/auth/refresh")).json()
        assert "manquant" in body["detail"]

    async def test_returns_200_with_valid_refresh_cookie(self, client):
        mock_service = AsyncMock()
        mock_service.refresh_access_token.return_value = make_token_pair(
            access_token="new_access", refresh_token="new_refresh"
        )
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        response = await client.post(
            "/auth/refresh",
            cookies={"refresh_token": "valid_refresh_token"},
        )
        assert response.status_code == 200

    async def test_response_contains_new_access_token(self, client):
        mock_service = AsyncMock()
        mock_service.refresh_access_token.return_value = make_token_pair(
            access_token="new_access_token"
        )
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        body = (
            await client.post(
                "/auth/refresh",
                cookies={"refresh_token": "valid_refresh_token"},
            )
        ).json()
        assert body["access_token"] == "new_access_token"

    async def test_sets_new_refresh_cookie(self, client):
        mock_service = AsyncMock()
        mock_service.refresh_access_token.return_value = make_token_pair()
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        response = await client.post(
            "/auth/refresh",
            cookies={"refresh_token": "old_refresh_token"},
        )
        assert "refresh_token" in response.cookies


class TestLogoutRoute:
    async def test_returns_204(self, client):
        response = await client.post("/auth/logout")
        assert response.status_code == 204

    async def test_response_body_is_empty(self, client):
        response = await client.post("/auth/logout")
        assert response.content == b""


class TestMeRoute:
    async def test_returns_200_for_authenticated_user(self, client):
        user = make_user()
        app.dependency_overrides[get_current_user] = lambda: user

        response = await client.get("/auth/me")
        assert response.status_code == 200

    async def test_returns_user_profile_data(self, client):
        user = make_user()
        app.dependency_overrides[get_current_user] = lambda: user

        body = (await client.get("/auth/me")).json()
        assert body["email"] == "test@example.com"
        assert body["full_name"] == "Test User"
        assert body["is_active"] is True

    async def test_returns_401_without_bearer_token(self, client):
        response = await client.get("/auth/me")
        assert response.status_code == 401

    async def test_returns_401_with_invalid_token(self, client):
        response = await client.get(
            "/auth/me",
            headers={"Authorization": "Bearer totally.invalid.token"},
        )
        assert response.status_code == 401
