from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.dependencies.auth import require_admin
from app.models.user import User
from app.repositories.users.user_sql_repo import SQLUserRepository
from app.schemas.admin import RoleUpdate, UserAdminOut
from app.services.user_admin_service import UserAdminService

router = APIRouter(prefix="/admin", tags=["admin"])


def get_user_admin_service(session: AsyncSession = Depends(get_session)) -> UserAdminService:
    return UserAdminService(SQLUserRepository(session))


@router.get("/users", response_model=list[UserAdminOut])
async def search_users(
    query: str = Query("", max_length=100),
    _: User = Depends(require_admin),
    service: UserAdminService = Depends(get_user_admin_service),
):
    return await service.search(query)


@router.patch("/users/{user_id}/role", response_model=UserAdminOut)
async def set_user_role(
    user_id: int,
    data: RoleUpdate,
    admin: User = Depends(require_admin),
    service: UserAdminService = Depends(get_user_admin_service),
):
    return await service.set_role(admin, user_id, data.role)
