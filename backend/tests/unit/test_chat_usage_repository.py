from datetime import date

import pytest
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.chat_usage import ChatUsage  # noqa: F401  (registers the table)
from app.models.user import User
from app.repositories.chat.chat_usage_sql_repo import SQLChatUsageRepository

DAY = date(2026, 10, 26)


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite://")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    async with AsyncSession(engine, expire_on_commit=False) as s:
        yield s
    await engine.dispose()


@pytest.fixture
async def user_id(session):
    user = User(full_name="Test", email="test@example.com")
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user.id


@pytest.fixture
def repo(session):
    return SQLChatUsageRepository(session)


class TestChatUsageRepository:
    async def test_count_is_zero_without_usage(self, repo, user_id):
        assert await repo.get_count(user_id, DAY) == 0

    async def test_increment_creates_then_adds(self, repo, user_id):
        assert await repo.increment(user_id, DAY) == 1
        assert await repo.increment(user_id, DAY) == 2
        assert await repo.get_count(user_id, DAY) == 2

    async def test_days_are_counted_separately(self, repo, user_id):
        await repo.increment(user_id, DAY)
        assert await repo.get_count(user_id, date(2026, 10, 27)) == 0

    async def test_users_are_counted_separately(self, repo, session, user_id):
        other = User(full_name="Other", email="other@example.com")
        session.add(other)
        await session.commit()
        await session.refresh(other)

        await repo.increment(user_id, DAY)
        assert await repo.get_count(other.id, DAY) == 0
