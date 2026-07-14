import pytest
from unittest.mock import AsyncMock, MagicMock, call

from app.repositories.users.user_sql_repo import SQLUserRepository
from app.models.user import User


EMAIL = "test@example.com"
FULL_NAME = "Test User"
GOOGLE_ID = "google-sub-123"


@pytest.fixture
def mock_session():
    session = AsyncMock()
    session.add = MagicMock()
    return session


@pytest.fixture
def repo(mock_session):
    return SQLUserRepository(session=mock_session)


def make_user(**overrides):
    base = dict(
        id=1,
        full_name=FULL_NAME,
        email=EMAIL,
        hashed_password="hashed_pw",
        is_active=True,
    )
    base.update(overrides)
    return User(**base)


class TestGetByGoogleId:
    async def test_returns_user_when_found(self, repo, mock_session):
        user = make_user(google_id=GOOGLE_ID)
        result_mock = MagicMock()
        result_mock.scalars.return_value.one_or_none.return_value = user
        mock_session.execute.return_value = result_mock

        result = await repo.get_by_google_id(GOOGLE_ID)

        assert result == user

    async def test_returns_none_when_not_found(self, repo, mock_session):
        result_mock = MagicMock()
        result_mock.scalars.return_value.one_or_none.return_value = None
        mock_session.execute.return_value = result_mock

        result = await repo.get_by_google_id(GOOGLE_ID)

        assert result is None

    async def test_executes_query_against_session(self, repo, mock_session):
        result_mock = MagicMock()
        result_mock.scalars.return_value.one_or_none.return_value = None
        mock_session.execute.return_value = result_mock

        await repo.get_by_google_id(GOOGLE_ID)

        mock_session.execute.assert_called_once()


class TestGetByEmail:
    async def test_returns_user_when_found(self, repo, mock_session):
        user = make_user()
        result_mock = MagicMock()
        result_mock.scalars.return_value.one_or_none.return_value = user
        mock_session.execute.return_value = result_mock

        result = await repo.get_by_email(EMAIL)

        assert result == user

    async def test_returns_none_when_not_found(self, repo, mock_session):
        result_mock = MagicMock()
        result_mock.scalars.return_value.one_or_none.return_value = None
        mock_session.execute.return_value = result_mock

        result = await repo.get_by_email("notfound@example.com")

        assert result is None

    async def test_executes_query_against_session(self, repo, mock_session):
        result_mock = MagicMock()
        result_mock.scalars.return_value.one_or_none.return_value = None
        mock_session.execute.return_value = result_mock

        await repo.get_by_email(EMAIL)

        mock_session.execute.assert_called_once()


class TestCreate:
    async def test_adds_user_to_session(self, repo, mock_session):
        user = make_user(id=None)
        mock_session.refresh = AsyncMock(return_value=None)

        await repo.create(user)

        mock_session.add.assert_called_once_with(user)

    async def test_commits_after_adding(self, repo, mock_session):
        user = make_user(id=None)
        mock_session.refresh = AsyncMock(return_value=None)

        await repo.create(user)

        mock_session.commit.assert_called_once()

    async def test_refreshes_user_after_commit(self, repo, mock_session):
        user = make_user(id=None)
        mock_session.refresh = AsyncMock(return_value=None)

        await repo.create(user)

        mock_session.refresh.assert_called_once_with(user)

    async def test_returns_user_after_creation(self, repo, mock_session):
        user = make_user(id=None)
        mock_session.refresh = AsyncMock(return_value=None)

        result = await repo.create(user)

        assert result is user


class TestUpdate:
    async def test_adds_user_to_session(self, repo, mock_session):
        user = make_user(google_id=GOOGLE_ID)
        mock_session.refresh = AsyncMock(return_value=None)

        await repo.update(user)

        mock_session.add.assert_called_once_with(user)

    async def test_commits_after_adding(self, repo, mock_session):
        user = make_user(google_id=GOOGLE_ID)
        mock_session.refresh = AsyncMock(return_value=None)

        await repo.update(user)

        mock_session.commit.assert_called_once()

    async def test_refreshes_user_after_commit(self, repo, mock_session):
        user = make_user(google_id=GOOGLE_ID)
        mock_session.refresh = AsyncMock(return_value=None)

        await repo.update(user)

        mock_session.refresh.assert_called_once_with(user)

    async def test_returns_user_after_update(self, repo, mock_session):
        user = make_user(google_id=GOOGLE_ID)
        mock_session.refresh = AsyncMock(return_value=None)

        result = await repo.update(user)

        assert result is user

    async def test_commit_happens_before_refresh(self, repo, mock_session):
        user = make_user(google_id=GOOGLE_ID)
        call_order = []
        mock_session.commit = AsyncMock(side_effect=lambda: call_order.append("commit"))
        mock_session.refresh = AsyncMock(side_effect=lambda u: call_order.append("refresh"))

        await repo.update(user)

        assert call_order == ["commit", "refresh"]


class TestDelete:
    async def test_deletes_user_from_session(self, repo, mock_session):
        user = make_user()
        mock_session.delete = AsyncMock(return_value=None)

        await repo.delete(user)

        mock_session.delete.assert_called_once_with(user)

    async def test_commits_after_deleting(self, repo, mock_session):
        user = make_user()
        mock_session.delete = AsyncMock(return_value=None)

        await repo.delete(user)

        mock_session.commit.assert_called_once()

    async def test_returns_deleted_user(self, repo, mock_session):
        user = make_user()
        mock_session.delete = AsyncMock(return_value=None)

        result = await repo.delete(user)

        assert result is user

    async def test_delete_happens_before_commit(self, repo, mock_session):
        user = make_user()
        call_order = []
        mock_session.delete = AsyncMock(side_effect=lambda u: call_order.append("delete"))
        mock_session.commit = AsyncMock(side_effect=lambda: call_order.append("commit"))

        await repo.delete(user)

        assert call_order == ["delete", "commit"]

    async def test_commit_happens_before_refresh(self, repo, mock_session):
        user = make_user(id=None)
        call_order = []
        mock_session.commit = AsyncMock(side_effect=lambda: call_order.append("commit"))
        mock_session.refresh = AsyncMock(side_effect=lambda u: call_order.append("refresh"))

        await repo.create(user)

        assert call_order == ["commit", "refresh"]
