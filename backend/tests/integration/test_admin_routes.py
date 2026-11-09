from datetime import datetime
from unittest.mock import AsyncMock

import pytest

from app.controllers.admin_controller import get_user_admin_service
from app.dependencies.auth import get_current_user
from app.enums.user_role import UserRole
from app.main import app
from app.models.user import User


@pytest.fixture
def service():
    service = AsyncMock()
    app.dependency_overrides[get_user_admin_service] = lambda: service
    return service


def log_in(role):
    user = User(id=1, full_name="Moi", email="me@example.com", role=role)
    app.dependency_overrides[get_current_user] = lambda: user
    return user


def account(role="user"):
    return User(
        id=2, full_name="Bob", email="bob@example.com", role=role, created_at=datetime(2026, 1, 1)
    )


class TestAdminRoutes:
    async def test_logged_out_is_401(self, client, service):
        assert (await client.get("/admin/users")).status_code == 401

    @pytest.mark.parametrize("role", ["user", "editor"])
    async def test_only_admins(self, client, service, role):
        log_in(role)
        assert (await client.get("/admin/users")).status_code == 403
        response = await client.patch("/admin/users/2/role", json={"role": "admin"})
        assert response.status_code == 403
        service.set_role.assert_not_awaited()

    async def test_search(self, client, service):
        log_in("admin")
        service.search.return_value = [account()]
        response = await client.get("/admin/users?query=bob")
        assert response.status_code == 200
        assert response.json()[0] == {
            "id": 2,
            "full_name": "Bob",
            "email": "bob@example.com",
            "role": "user",
            "created_at": "2026-01-01T00:00:00",
        }
        service.search.assert_awaited_once_with("bob")

    async def test_set_role(self, client, service):
        admin = log_in("admin")
        service.set_role.return_value = account("editor")
        response = await client.patch("/admin/users/2/role", json={"role": "editor"})
        assert response.status_code == 200
        assert response.json()["role"] == "editor"
        service.set_role.assert_awaited_once_with(admin, 2, UserRole.editor)

    async def test_unknown_role_is_rejected(self, client, service):
        log_in("admin")
        response = await client.patch("/admin/users/2/role", json={"role": "boss"})
        assert response.status_code == 422
