import pytest
from fastapi import HTTPException

from app.auth.jwt_token_service import JWTTokenService
from app.dependencies.auth import has_role, require_admin, require_editor
from app.enums.user_role import UserRole
from app.models.user import User


def user_with(role):
    return User(id=1, full_name="Test", email="t@example.com", role=role)


class TestRequireRoles:
    @pytest.mark.parametrize("role", ["editor", "admin", UserRole.editor])
    async def test_editors_and_admins_pass(self, role):
        user = user_with(role)
        assert await require_editor(user) is user

    async def test_readers_are_refused(self):
        with pytest.raises(HTTPException) as exc:
            await require_editor(user_with("user"))
        assert exc.value.status_code == 403

    async def test_editors_are_not_admins(self):
        with pytest.raises(HTTPException) as exc:
            await require_admin(user_with("editor"))
        assert exc.value.status_code == 403
        assert await require_admin(user_with("admin"))

    def test_has_role_compares_plain_text_and_enum(self):
        assert has_role(user_with("admin"), UserRole.admin)
        assert not has_role(user_with("user"), UserRole.editor, UserRole.admin)


class TestRoleClaim:
    def test_tokens_carry_the_role(self):
        service = JWTTokenService(secret_key="s", algorithm="HS256")
        token = service.create_access_token("1", "t@example.com", "Test", 0, role="editor")
        assert service.verify_token(token).role == "editor"

    def test_tokens_without_role_read_as_user(self):
        service = JWTTokenService(secret_key="s", algorithm="HS256")
        token = service.create_refresh_token("1", "t@example.com")
        assert service.verify_token(token).role == "user"
