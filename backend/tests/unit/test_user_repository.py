import pytest
from unittest.mock import AsyncMock, MagicMock, call

from app.repositories.users.user_sql_repo import SQLUserRepository
from app.models.user import User


EMAIL = "test@example.com"
FULL_NAME = "Test User"


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

    async def test_commit_happens_before_refresh(self, repo, mock_session):
        user = make_user(id=None)
        call_order = []
        mock_session.commit = AsyncMock(side_effect=lambda: call_order.append("commit"))
        mock_session.refresh = AsyncMock(side_effect=lambda u: call_order.append("refresh"))

        await repo.create(user)

        assert call_order == ["commit", "refresh"]
