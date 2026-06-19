from datetime import datetime, timedelta, timezone

import pytest
from jose import JWTError, jwt

from app.auth.jwt_token_service import JWTTokenService
from app.core.jwt_config import TOKEN_TYPE_ACCESS, TOKEN_TYPE_REFRESH

SECRET = "test-secret-key"
ALGORITHM = "HS256"
USER_ID = "42"
EMAIL = "user@example.com"
FULL_NAME = "John Doe"


@pytest.fixture
def service() -> JWTTokenService:
    return JWTTokenService(secret_key=SECRET, algorithm=ALGORITHM)


class TestCreateAccessToken:
    def test_returns_non_empty_string(self, service):
        token = service.create_access_token(USER_ID, EMAIL)
        assert isinstance(token, str) and len(token) > 0

    def test_payload_token_type_is_access(self, service):
        token = service.create_access_token(USER_ID, EMAIL)
        payload = service.verify_token(token)
        assert payload.token_type == TOKEN_TYPE_ACCESS

    def test_payload_contains_correct_email(self, service):
        token = service.create_access_token(USER_ID, EMAIL)
        payload = service.verify_token(token)
        assert payload.email == EMAIL

    def test_payload_contains_correct_subject(self, service):
        token = service.create_access_token(USER_ID, EMAIL)
        payload = service.verify_token(token)
        assert payload.sub == USER_ID

    def test_payload_contains_full_name(self, service):
        token = service.create_access_token(USER_ID, EMAIL, FULL_NAME)
        payload = service.verify_token(token)
        assert payload.full_name == FULL_NAME

    def test_full_name_is_none_by_default(self, service):
        token = service.create_access_token(USER_ID, EMAIL)
        payload = service.verify_token(token)
        assert payload.full_name is None


class TestCreateRefreshToken:
    def test_returns_non_empty_string(self, service):
        token = service.create_refresh_token(USER_ID, EMAIL)
        assert isinstance(token, str) and len(token) > 0

    def test_payload_token_type_is_refresh(self, service):
        token = service.create_refresh_token(USER_ID, EMAIL)
        payload = service.verify_token(token)
        assert payload.token_type == TOKEN_TYPE_REFRESH

    def test_access_and_refresh_tokens_differ(self, service):
        access = service.create_access_token(USER_ID, EMAIL)
        refresh = service.create_refresh_token(USER_ID, EMAIL)
        assert access != refresh


class TestVerifyToken:
    def test_invalid_token_raises_jwt_error(self, service):
        with pytest.raises(JWTError):
            service.verify_token("not.a.valid.token")

    def test_empty_token_raises_jwt_error(self, service):
        with pytest.raises(JWTError):
            service.verify_token("")

    def test_wrong_secret_raises_jwt_error(self, service):
        other = JWTTokenService(secret_key="other-secret", algorithm=ALGORITHM)
        token = other.create_access_token(USER_ID, EMAIL)
        with pytest.raises(JWTError):
            service.verify_token(token)

    def test_expired_token_raises_jwt_error(self, service):
        now = datetime.now(timezone.utc)
        payload = {
            "sub": USER_ID,
            "email": EMAIL,
            "full_name": None,
            "token_type": TOKEN_TYPE_ACCESS,
            "iat": int((now - timedelta(hours=2)).timestamp()),
            "exp": int((now - timedelta(hours=1)).timestamp()),
        }
        expired_token = jwt.encode(payload, SECRET, algorithm=ALGORITHM)
        with pytest.raises(JWTError):
            service.verify_token(expired_token)
