import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.enums.user_role import UserRole
from app.models.user import User
from app.repositories.users.user_sql_repo import SQLUserRepository
from app.scripts.set_role import main, set_role
from app.services.user_admin_service import UserAdminService


@pytest.fixture
async def session_factory():
    engine = create_async_engine("sqlite+aiosqlite://")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    await engine.dispose()


@pytest.fixture
async def session(session_factory):
    async with session_factory() as s:
        yield s


@pytest.fixture
async def users(session):
    rows = [
        User(full_name="Alice Admin", email="alice@example.com", role="admin"),
        User(full_name="Bob Lecteur", email="bob@example.com"),
        User(full_name="Chloé Plume", email="chloe@example.com"),
    ]
    session.add_all(rows)
    await session.commit()
    return rows


@pytest.fixture
def service(session):
    return UserAdminService(SQLUserRepository(session))


class TestSearch:
    async def test_by_email_or_name_any_case(self, service, users):
        assert [u.email for u in await service.search("BOB")] == ["bob@example.com"]
        assert [u.email for u in await service.search("plume")] == ["chloe@example.com"]

    async def test_empty_query_lists_everyone(self, service, users):
        assert len(await service.search("  ")) == 3


class TestSetRole:
    async def test_admin_promotes_a_reader(self, service, users):
        admin, bob, _ = users
        updated = await service.set_role(admin, bob.id, UserRole.editor)
        assert updated.role == UserRole.editor

    async def test_unknown_user(self, service, users):
        with pytest.raises(HTTPException) as exc:
            await service.set_role(users[0], 999, UserRole.editor)
        assert exc.value.status_code == 404

    async def test_admin_cannot_demote_themselves(self, service, users):
        admin = users[0]
        with pytest.raises(HTTPException) as exc:
            await service.set_role(admin, admin.id, UserRole.user)
        assert exc.value.status_code == 409


class TestSetRoleScript:
    async def test_sets_the_role_of_an_existing_account(self, session_factory, users):
        assert await set_role(" Bob@Example.com ", UserRole.admin, session_factory)
        async with session_factory() as s:
            bob = await SQLUserRepository(s).get_by_email("bob@example.com")
        assert bob.role == "admin"

    async def test_unknown_account(self, session_factory, users):
        assert not await set_role("nobody@example.com", UserRole.admin, session_factory)

    def test_cli_rejects_unknown_roles(self):
        with pytest.raises(SystemExit):
            main(["bob@example.com", "superuser"])
