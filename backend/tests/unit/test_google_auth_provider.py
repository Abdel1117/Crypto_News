import pytest
from types import SimpleNamespace

from app.clients.google_auth_provider import (
    GoogleAuthNotConfigured,
    GoogleAuthProvider,
    InvalidGoogleCredentials,
)

CLIENT_ID = "test-client-id.apps.googleusercontent.com"
RAW_TOKEN = "raw_google_id_token"


@pytest.fixture
def provider():
    return GoogleAuthProvider(client_id=CLIENT_ID)


def make_credentials(token=RAW_TOKEN):
    return SimpleNamespace(credentials=token)


class TestVerifyCredentials:
    def test_raises_value_error_when_client_id_not_configured(self, monkeypatch):
        monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
        provider = GoogleAuthProvider(client_id=None)

        with pytest.raises(ValueError):
            provider.verify_credentials(make_credentials())

    def test_returns_user_info_on_valid_token(self, provider, monkeypatch):
        payload = {"email": "user@example.com", "name": "Test User", "sub": "google-sub-123", "email_verified": True}
        monkeypatch.setattr(
            "app.clients.google_auth_provider.id_token.verify_oauth2_token",
            lambda *args, **kwargs: payload,
        )

        result = provider.verify_credentials(make_credentials())

        assert result.email == "user@example.com"
        assert result.full_name == "Test User"
        assert result.google_id == "google-sub-123"

    def test_full_name_is_none_when_missing_from_payload(self, provider, monkeypatch):
        payload = {"email": "user@example.com", "sub": "google-sub-123", "email_verified": True}
        monkeypatch.setattr(
            "app.clients.google_auth_provider.id_token.verify_oauth2_token",
            lambda *args, **kwargs: payload,
        )

        result = provider.verify_credentials(make_credentials())

        assert result.full_name is None

    def test_raises_value_error_on_invalid_token(self, provider, monkeypatch):
        def _raise(*args, **kwargs):
            raise ValueError("Token expired")

        monkeypatch.setattr(
            "app.clients.google_auth_provider.id_token.verify_oauth2_token",
            _raise,
        )

        with pytest.raises(ValueError):
            provider.verify_credentials(make_credentials())

    def test_passes_configured_client_id_to_verifier(self, provider, monkeypatch):
        captured = {}

        def _verify(token, request, audience, clock_skew_in_seconds=0):
            captured["audience"] = audience
            return {"email": "user@example.com", "sub": "google-sub-123", "email_verified": True}

        monkeypatch.setattr(
            "app.clients.google_auth_provider.id_token.verify_oauth2_token",
            _verify,
        )

        provider.verify_credentials(make_credentials())

        assert captured["audience"] == CLIENT_ID

    def test_falls_back_to_env_var_when_client_id_not_passed(self, monkeypatch):
        monkeypatch.setenv("GOOGLE_CLIENT_ID", "env-client-id")
        provider = GoogleAuthProvider()

        assert provider.client_id == "env-client-id"


def stub_payload(monkeypatch, payload):
    monkeypatch.setattr(
        "app.clients.google_auth_provider.id_token.verify_oauth2_token",
        lambda *args, **kwargs: payload,
    )


class TestEmailVerification:
    @pytest.mark.parametrize("verified", [False, None, "false"])
    def test_rejects_unverified_email(self, provider, monkeypatch, verified):
        payload = {"email": "victim@example.com", "sub": "attacker-sub"}
        if verified is not None:
            payload["email_verified"] = verified
        stub_payload(monkeypatch, payload)

        with pytest.raises(InvalidGoogleCredentials):
            provider.verify_credentials(make_credentials())

    def test_accepts_string_true(self, provider, monkeypatch):
        stub_payload(monkeypatch, {"email": "u@example.com", "sub": "s", "email_verified": "true"})
        assert provider.verify_credentials(make_credentials()).email == "u@example.com"

    def test_rejects_missing_email(self, provider, monkeypatch):
        stub_payload(monkeypatch, {"sub": "s", "email_verified": True})
        with pytest.raises(InvalidGoogleCredentials):
            provider.verify_credentials(make_credentials())

    def test_lowercases_email(self, provider, monkeypatch):
        stub_payload(monkeypatch, {"email": "User@Example.COM", "sub": "s", "email_verified": True})
        assert provider.verify_credentials(make_credentials()).email == "user@example.com"

    def test_missing_client_id_has_its_own_error(self, monkeypatch):
        monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
        with pytest.raises(GoogleAuthNotConfigured):
            GoogleAuthProvider(client_id=None).verify_credentials(make_credentials())
