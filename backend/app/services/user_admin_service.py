from fastapi import HTTPException, status

from app.enums.user_role import UserRole
from app.models.user import User
from app.repositories.users.user_sql_repo import SQLUserRepository


class UserAdminService:
    """Admins assign roles: who may write on the blog, who may assign roles."""

    def __init__(self, users: SQLUserRepository) -> None:
        self.users = users

    async def search(self, query: str) -> list[User]:
        return await self.users.search(query.strip())

    async def set_role(self, admin: User, user_id: int, role: UserRole) -> User:
        user = await self.users.get_by_id(user_id)
        if user is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Utilisateur introuvable.")
        # Keeps at least one admin: another admin has to do it.
        if user.id == admin.id and role != UserRole.admin:
            raise HTTPException(
                status.HTTP_409_CONFLICT, "Tu ne peux pas retirer ton propre rôle d'admin."
            )
        user.role = role
        return await self.users.update(user)
