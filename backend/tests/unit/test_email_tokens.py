from datetime import datetime, timedelta, timezone

import pytest
from jose import JWTError, jwt

from app.auth.email_tokens import (
    PURPOSE_CONFIRM_EMAIL,
    PURPOSE_STOP_ALERTS,
    create_email_token,
    read_email_token,
)
from app.auth.jwt_token_service import JWTTokenService
from app.core.jwt_config import JWT_ALGORITHM, JWT_SECRET_KEY


def signed(claims: dict, secret: str = JWT_SECRET_KEY) -> str:
    return jwt.encode(claims, secret, algorithm=JWT_ALGORITHM)


def future() -> int:
    return int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp())


class TestEmailTokens:
    @pytest.mark.parametrize("purpose", [PURPOSE_CONFIRM_EMAIL, PURPOSE_STOP_ALERTS])
    def test_reads_back_the_user(self, purpose):
        assert read_email_token(create_email_token(42, purpose), purpose) == 42

    def test_refuses_a_token_for_another_purpose(self):
        token = create_email_token(42, PURPOSE_STOP_ALERTS)
        assert read_email_token(token, PURPOSE_CONFIRM_EMAIL) is None

    def test_refuses_a_token_signed_with_another_key(self):
        token = signed({"sub": "42", "aud": PURPOSE_STOP_ALERTS, "exp": future()}, secret="x" * 40)
        assert read_email_token(token, PURPOSE_STOP_ALERTS) is None

    def test_refuses_an_expired_token(self):
        past = int((datetime.now(timezone.utc) - timedelta(seconds=5)).timestamp())
        token = signed({"sub": "42", "aud": PURPOSE_CONFIRM_EMAIL, "exp": past})
        assert read_email_token(token, PURPOSE_CONFIRM_EMAIL) is None

    @pytest.mark.parametrize("token", ["", "not-a-jwt", "a.b.c"])
    def test_refuses_garbage(self, token):
        assert read_email_token(token, PURPOSE_STOP_ALERTS) is None

    @pytest.mark.parametrize("claims", [{"aud": PURPOSE_STOP_ALERTS}, {"aud": PURPOSE_STOP_ALERTS, "sub": "abc"}])
    def test_refuses_a_token_without_a_usable_user(self, claims):
        assert read_email_token(signed({**claims, "exp": future()}), PURPOSE_STOP_ALERTS) is None


class TestSeparationFromSessions:
    """A link in an email must not open a session, and a session must not act as a link."""

    @pytest.mark.parametrize("purpose", [PURPOSE_CONFIRM_EMAIL, PURPOSE_STOP_ALERTS])
    def test_session_tokens_cant_act_as_a_link(self, purpose):
        access = JWTTokenService().create_access_token("42", "a@example.com")
        refresh = JWTTokenService().create_refresh_token("42", "a@example.com")
        assert read_email_token(access, purpose) is None
        assert read_email_token(refresh, purpose) is None

    @pytest.mark.parametrize("purpose", [PURPOSE_CONFIRM_EMAIL, PURPOSE_STOP_ALERTS])
    def test_email_tokens_cant_open_a_session(self, purpose):
        with pytest.raises(JWTError):
            JWTTokenService().verify_token(create_email_token(42, purpose))
