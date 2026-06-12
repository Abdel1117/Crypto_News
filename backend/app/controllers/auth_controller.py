from fastapi import APIRouter, Depends, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.session import get_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.users.user_repository import SQLUserRepository
from app.schemas.auth import AuthRegistrationRequest, AuthRegistrationResponse, LoginRequest
from app.schemas.token import RefreshTokenRequest, TokenResponse
from app.services.auth_service import AuthService
from app.auth.jwt_token_service import JWTTokenService

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(session: AsyncSession = Depends(get_session)) -> AuthService:
    return AuthService(
        user_repository=SQLUserRepository(session),
        token_service=JWTTokenService(),
    )


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


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await auth_service.login(login_data.email, login_data.password)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await auth_service.refresh_access_token(refresh_data.refresh_token)


@router.get("/me", response_model=AuthRegistrationResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> AuthRegistrationResponse:
    return current_user
