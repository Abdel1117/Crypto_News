from fastapi import APIRouter, Depends, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.session import get_session
from app.repositories.user_repository import SQLUserRepository
from app.schemas.auth import AuthRegistrationRequest, AuthRegistrationResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


async def get_auth_service(session: AsyncSession = Depends(get_session)) -> AuthService:
    return AuthService(user_repository=SQLUserRepository(session))


@router.post(
    "/register",
    response_model=AuthRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_user(
    registration_data: AuthRegistrationRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthRegistrationResponse:
    return await auth_service.register_user(registration_data)
