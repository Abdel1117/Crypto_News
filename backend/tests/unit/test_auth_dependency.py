from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from jose import JWTError

from app.auth.jwt_token_service import JWTTokenService
from app.dependencies.auth import get_current_user
from app.models.user import User


SECRET = "test-secret-key"
ALGORITHM = "HS256"
USER_ID = "1"
EMAIL = "user@example.com"
FULL_NAME = "Test User"


@pytest.fixture
def token_service():
    return JWTTokenService(secret_key=SECRET, algorithm=ALGORITHM)


def make_user(**overrides):
    base = dict(
        id=1,
        full_name=FULL_NAME,
        email=EMAIL,
        hashed_password="hashed",
        is_active=True,
        created_at=datetime(2024, 1, 1),
    )
    base.update(overrides)
    return User(**base)


def make_mock_session(user):
    """Return a mock AsyncSession whose execute() returns the given user."""
    result = MagicMock()
    result.scalars.return_value.one_or_none.return_value = user
    session = AsyncMock()
    session.execute.return_value = result
    return session


class TestGetCurrentUser:
    async def test_returns_user_for_valid_access_token(self, token_service):
        user = make_user()
        token = token_service.create_access_token(USER_ID, EMAIL, FULL_NAME)
        session = make_mock_session(user)

        with patch("app.dependencies.auth._token_service", token_service):
            result = await get_current_user(token=token, session=session)

        assert result == user

    async def test_raises_401_for_invalid_token(self, token_service):
        session = make_mock_session(None)

        with patch("app.dependencies.auth._token_service", token_service):
            with pytest.raises(HTTPException) as exc:
                await get_current_user(token="bad.token.here", session=session)

        assert exc.value.status_code == 401

    async def test_raises_401_when_refresh_token_used_instead_of_access(self, token_service):
        user = make_user()
        refresh_token = token_service.create_refresh_token(USER_ID, EMAIL, FULL_NAME)
        session = make_mock_session(user)

        with patch("app.dependencies.auth._token_service", token_service):
            with pytest.raises(HTTPException) as exc:
                await get_current_user(token=refresh_token, session=session)

        assert exc.value.status_code == 401

    async def test_raises_401_when_user_not_found(self, token_service):
        token = token_service.create_access_token(USER_ID, EMAIL, FULL_NAME)
        session = make_mock_session(None)

        with patch("app.dependencies.auth._token_service", token_service):
            with pytest.raises(HTTPException) as exc:
                await get_current_user(token=token, session=session)

        assert exc.value.status_code == 401

    async def test_raises_401_when_user_inactive(self, token_service):
        inactive_user = make_user(is_active=False)
        token = token_service.create_access_token(USER_ID, EMAIL, FULL_NAME)
        session = make_mock_session(inactive_user)

        with patch("app.dependencies.auth._token_service", token_service):
            with pytest.raises(HTTPException) as exc:
                await get_current_user(token=token, session=session)

        assert exc.value.status_code == 401
