import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException

from app.services.auth_service import AuthService
from app.schemas.auth import AuthRegistrationRequest, AuthRegistrationRequestGoogle
from app.schemas.token import TokenPayload
from app.models.user import User
from app.core.jwt_config import TOKEN_TYPE_ACCESS, TOKEN_TYPE_REFRESH
from app.enums.auth_provider import AuthProvider
from app.interface.protocol.GoogleAuthProvider import GoogleUserInfo

USER_ID = 1
EMAIL = "test@example.com"
PASSWORD = "password123"
FULL_NAME = "Test User"
GOOGLE_ID = "google-sub-123"
GOOGLE_CREDENTIALS = AuthRegistrationRequestGoogle(credentials="raw_google_token")


@pytest.fixture
def mock_repo():
    return AsyncMock()


@pytest.fixture
def mock_google_provider():
    return MagicMock()

@pytest.fixture
def mock_token_service():
    svc = MagicMock()
    svc.create_access_token.return_value = "mocked_access_token"
    svc.create_refresh_token.return_value = "mocked_refresh_token"
    return svc


@pytest.fixture
def mock_hasher():
    hasher = MagicMock()
    hasher.hash.return_value = "hashed_password"
    hasher.verify.return_value = True
    return hasher


@pytest.fixture
def active_user():
    return User(
        id=USER_ID,
        full_name=FULL_NAME,
        email=EMAIL,
        hashed_password="hashed_password",
        is_active=True,
        provider=AuthProvider.local,
    )


@pytest.fixture
def service(mock_google_provider, mock_repo, mock_token_service, mock_hasher):
    return AuthService(
        google_auth_provider=mock_google_provider,
        user_repository=mock_repo,
        token_service=mock_token_service,
        password_hasher=mock_hasher,
    )


class TestRegisterUser:
    async def test_creates_user_successfully(self, service, mock_repo, active_user):
        mock_repo.get_by_email.return_value = None
        mock_repo.create.return_value = active_user

        request = AuthRegistrationRequest(fullname=FULL_NAME, email=EMAIL, password=PASSWORD, provider=AuthProvider.local)
        result = await service.register_user(request)

        assert result == active_user
        mock_repo.create.assert_called_once()

    async def test_normalizes_email_to_lowercase(self, service, mock_repo, active_user):
        mock_repo.get_by_email.return_value = None
        mock_repo.create.return_value = active_user

        request = AuthRegistrationRequest(fullname=FULL_NAME, email="USER@EXAMPLE.COM", password=PASSWORD, provider=AuthProvider.local)
        await service.register_user(request)

        mock_repo.get_by_email.assert_called_with("user@example.com")

    async def test_hashes_password_before_storing(self, service, mock_repo, mock_hasher, active_user):
        mock_repo.get_by_email.return_value = None
        mock_repo.create.return_value = active_user

        request = AuthRegistrationRequest(fullname=FULL_NAME, email=EMAIL, password=PASSWORD, provider=AuthProvider.local)
        await service.register_user(request)

        mock_hasher.hash.assert_called_once_with(PASSWORD)

    async def test_raises_400_if_email_already_taken(self, service, mock_repo, active_user):
        mock_repo.get_by_email.return_value = active_user

        request = AuthRegistrationRequest(fullname=FULL_NAME, email=EMAIL, password=PASSWORD, provider=AuthProvider.local)
        with pytest.raises(HTTPException) as exc:
            await service.register_user(request)

        assert exc.value.status_code == 400


class TestAuthenticateUser:
    async def test_returns_user_on_valid_credentials(self, service, mock_repo, active_user):
        mock_repo.get_by_email.return_value = active_user

        result = await service.authenticate_user(EMAIL, PASSWORD)
        assert result == active_user

    async def test_raises_401_when_user_not_found(self, service, mock_repo):
        mock_repo.get_by_email.return_value = None

        with pytest.raises(HTTPException) as exc:
            await service.authenticate_user(EMAIL, PASSWORD)

        assert exc.value.status_code == 401

    async def test_raises_401_when_user_inactive(self, service, mock_repo):
        mock_repo.get_by_email.return_value = User(
            id=USER_ID, full_name=FULL_NAME, email=EMAIL,
            hashed_password="hashed", is_active=False,
        )
        with pytest.raises(HTTPException) as exc:
            await service.authenticate_user(EMAIL, PASSWORD)

        assert exc.value.status_code == 401

    async def test_raises_401_when_password_wrong(self, service, mock_repo, mock_hasher, active_user):
        mock_repo.get_by_email.return_value = active_user
        mock_hasher.verify.return_value = False

        with pytest.raises(HTTPException) as exc:
            await service.authenticate_user(EMAIL, "bad_password")

        assert exc.value.status_code == 401

    async def test_normalizes_email_before_lookup(self, service, mock_repo, active_user):
        mock_repo.get_by_email.return_value = active_user

        await service.authenticate_user("USER@EXAMPLE.COM", PASSWORD)
        mock_repo.get_by_email.assert_called_with("user@example.com")


class TestLogin:
    async def test_returns_token_response(self, service, mock_repo, active_user):
        mock_repo.get_by_email.return_value = active_user

        result = await service.login(EMAIL, PASSWORD)

        assert result.access_token == "mocked_access_token"
        assert result.refresh_token == "mocked_refresh_token"
        assert result.token_type == "bearer"

    async def test_raises_runtime_error_without_token_service(self, mock_repo, mock_google_provider):
        service = AuthService(google_auth_provider=mock_google_provider, user_repository=mock_repo )
        with pytest.raises(RuntimeError):
            await service.login(EMAIL, PASSWORD)


class TestRefreshAccessToken:
    def _refresh_payload(self, token_type=TOKEN_TYPE_REFRESH):
        return TokenPayload(
            sub=str(USER_ID), email=EMAIL, full_name=FULL_NAME,
            token_type=token_type, exp=9999999999, iat=1000000000,
        )

    async def test_returns_new_tokens(self, service, mock_repo, mock_token_service, active_user):
        mock_token_service.verify_token.return_value = self._refresh_payload()
        mock_repo.get_by_email.return_value = active_user

        result = await service.refresh_access_token("valid_refresh_token")

        assert result.access_token == "mocked_access_token"
        assert result.refresh_token == "mocked_refresh_token"

    async def test_raises_401_when_token_type_is_access(self, service, mock_token_service):
        mock_token_service.verify_token.return_value = self._refresh_payload(TOKEN_TYPE_ACCESS)

        with pytest.raises(HTTPException) as exc:
            await service.refresh_access_token("access_token_passed_by_mistake")

        assert exc.value.status_code == 401

    async def test_raises_401_when_user_not_found(self, service, mock_repo, mock_token_service):
        mock_token_service.verify_token.return_value = self._refresh_payload()
        mock_repo.get_by_email.return_value = None

        with pytest.raises(HTTPException) as exc:
            await service.refresh_access_token("valid_refresh_token")

        assert exc.value.status_code == 401

    async def test_raises_401_when_user_inactive(self, service, mock_repo, mock_token_service):
        mock_token_service.verify_token.return_value = self._refresh_payload()
        mock_repo.get_by_email.return_value = User(
            id=USER_ID, full_name=FULL_NAME, email=EMAIL,
            hashed_password="hashed", is_active=False,
        )
        with pytest.raises(HTTPException) as exc:
            await service.refresh_access_token("valid_refresh_token")

        assert exc.value.status_code == 401

    async def test_raises_runtime_error_without_token_service(self, mock_repo , mock_google_provider):
        service = AuthService(google_auth_provider=mock_google_provider ,user_repository=mock_repo)
        with pytest.raises(RuntimeError):
            await service.refresh_access_token("any_token")


class TestGoogleAuth:
    def _google_user_info(self, **overrides):
        base = dict(email=EMAIL, full_name=FULL_NAME, google_id=GOOGLE_ID)
        base.update(overrides)
        return GoogleUserInfo(**base)

    async def test_raises_runtime_error_without_google_provider(self, mock_repo, mock_token_service, mock_hasher):
        service = AuthService(
            google_auth_provider=None,
            user_repository=mock_repo,
            token_service=mock_token_service,
            password_hasher=mock_hasher,
        )
        with pytest.raises(RuntimeError):
            await service.google_auth(GOOGLE_CREDENTIALS)

    async def test_creates_new_user_when_none_exists(self, service, mock_repo, mock_google_provider):
        mock_google_provider.verify_credentials.return_value = self._google_user_info()
        mock_repo.get_by_google_id.return_value = None
        mock_repo.get_by_email.return_value = None
        mock_repo.create.return_value = User(
            id=USER_ID, full_name=FULL_NAME, email=EMAIL, google_id=GOOGLE_ID,
            provider=AuthProvider.google, is_active=True,
        )

        await service.google_auth(GOOGLE_CREDENTIALS)

        created_user = mock_repo.create.call_args.args[0]
        assert created_user.email == EMAIL
        assert created_user.google_id == GOOGLE_ID
        assert created_user.provider == AuthProvider.google
        assert created_user.hashed_password is None

    async def test_looks_up_by_google_id_first(self, service, mock_repo, mock_google_provider):
        mock_google_provider.verify_credentials.return_value = self._google_user_info()
        mock_repo.get_by_google_id.return_value = User(
            id=USER_ID, full_name=FULL_NAME, email=EMAIL, google_id=GOOGLE_ID,
            provider=AuthProvider.google, is_active=True,
        )

        await service.google_auth(GOOGLE_CREDENTIALS)

        mock_repo.get_by_google_id.assert_called_once_with(GOOGLE_ID)
        mock_repo.get_by_email.assert_not_called()
        mock_repo.create.assert_not_called()

    async def test_links_existing_local_account_found_by_email(self, service, mock_repo, mock_google_provider):
        mock_google_provider.verify_credentials.return_value = self._google_user_info()
        existing_local_user = User(
            id=USER_ID, full_name=FULL_NAME, email=EMAIL, google_id=None,
            hashed_password="hashed_password", provider=AuthProvider.local, is_active=True,
        )
        mock_repo.get_by_google_id.return_value = None
        mock_repo.get_by_email.return_value = existing_local_user
        mock_repo.update.return_value = existing_local_user

        await service.google_auth(GOOGLE_CREDENTIALS)

        mock_repo.get_by_email.assert_called_once_with(EMAIL)
        mock_repo.create.assert_not_called()
        updated_user = mock_repo.update.call_args.args[0]
        assert updated_user.google_id == GOOGLE_ID
        assert updated_user.provider == AuthProvider.google

    async def test_does_not_relink_when_google_id_already_set(self, service, mock_repo, mock_google_provider):
        mock_google_provider.verify_credentials.return_value = self._google_user_info()
        mock_repo.get_by_google_id.return_value = User(
            id=USER_ID, full_name=FULL_NAME, email=EMAIL, google_id=GOOGLE_ID,
            provider=AuthProvider.google, is_active=True,
        )

        await service.google_auth(GOOGLE_CREDENTIALS)

        mock_repo.update.assert_not_called()

    async def test_raises_403_when_user_inactive(self, service, mock_repo, mock_google_provider):
        mock_google_provider.verify_credentials.return_value = self._google_user_info()
        mock_repo.get_by_google_id.return_value = User(
            id=USER_ID, full_name=FULL_NAME, email=EMAIL, google_id=GOOGLE_ID,
            provider=AuthProvider.google, is_active=False,
        )

        with pytest.raises(HTTPException) as exc:
            await service.google_auth(GOOGLE_CREDENTIALS)

        assert exc.value.status_code == 403

    async def test_returns_token_pair_on_success(self, service, mock_repo, mock_google_provider):
        mock_google_provider.verify_credentials.return_value = self._google_user_info()
        mock_repo.get_by_google_id.return_value = User(
            id=USER_ID, full_name=FULL_NAME, email=EMAIL, google_id=GOOGLE_ID,
            provider=AuthProvider.google, is_active=True,
        )

        result = await service.google_auth(GOOGLE_CREDENTIALS)

        assert result.access_token == "mocked_access_token"
        assert result.refresh_token == "mocked_refresh_token"
        assert result.token_type == "bearer"

    async def test_passes_credentials_to_google_provider(self, service, mock_repo, mock_google_provider):
        mock_google_provider.verify_credentials.return_value = self._google_user_info()
        mock_repo.get_by_google_id.return_value = User(
            id=USER_ID, full_name=FULL_NAME, email=EMAIL, google_id=GOOGLE_ID,
            provider=AuthProvider.google, is_active=True,
        )

        await service.google_auth(GOOGLE_CREDENTIALS)

        mock_google_provider.verify_credentials.assert_called_once_with(GOOGLE_CREDENTIALS)
