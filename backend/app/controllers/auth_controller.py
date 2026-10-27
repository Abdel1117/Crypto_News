from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.jwt_config import REFRESH_TOKEN_EXPIRE_DELTA
from app.db.session import get_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.users.user_sql_repo import SQLUserRepository
from app.schemas.auth import AuthRegistrationRequest, AuthRegistrationResponse, LoginRequest, AuthRegistrationRequestGoogle
from app.clients.google_auth_provider import  GoogleAuthProvider
from app.schemas.token import AccessTokenResponse
from app.services.auth_service import AuthService
from app.auth.jwt_token_service import JWTTokenService
import os 
router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "refresh_token"
REFRESH_MAX_AGE = int(REFRESH_TOKEN_EXPIRE_DELTA.total_seconds())
_IS_PROD = os.getenv("ENV") == "production"


def get_auth_service(session: AsyncSession = Depends(get_session)) -> AuthService:
    return AuthService(
        user_repository=SQLUserRepository(session),
        token_service=JWTTokenService(),
        google_auth_provider=GoogleAuthProvider()
    )


def _cookie_path(request: Request) -> str:
    """Path of the refresh cookie, as the browser sees the auth routes.

    Locally the API is served at the root, so this is "/auth". In production
    nginx serves it under "/api" and uvicorn runs with --root-path /api, so
    this becomes "/api/auth" and the browser sends the cookie to the refresh call.
    """
    return request.scope.get("root_path", "").rstrip("/") + "/auth"


def _set_refresh_cookie(request: Request, response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        samesite="strict",
        secure=_IS_PROD,
        max_age=REFRESH_MAX_AGE,
        path=_cookie_path(request),
    )


def _access_response(token_pair) -> AccessTokenResponse:
    return AccessTokenResponse(
        access_token=token_pair.access_token,
        token_type=token_pair.token_type,
        expires_in=token_pair.expires_in,
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


@router.post("/google", 
             response_model=AccessTokenResponse,
             status_code=status.HTTP_201_CREATED
             )
async def register_user_google(
        credentials : AuthRegistrationRequestGoogle,
        request: Request,
        response: Response,
        auth_service : AuthService = Depends(get_auth_service),
) -> AccessTokenResponse:
    token_pair = await auth_service.google_auth(credentials)
    # Same session as a password login: without this cookie, Google users
    # lose their session on reload and when the access token expires.
    _set_refresh_cookie(request, response, token_pair.refresh_token)
    return _access_response(token_pair)



@router.post("/login", response_model=AccessTokenResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
) -> AccessTokenResponse:
    token_pair = await auth_service.login(login_data.email, login_data.password)
    _set_refresh_cookie(request, response, token_pair.refresh_token)
    return _access_response(token_pair)


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh_token(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
    auth_service: AuthService = Depends(get_auth_service),
) -> AccessTokenResponse:
    if refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token manquant.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_pair = await auth_service.refresh_access_token(refresh_token)
    _set_refresh_cookie(request, response, token_pair.refresh_token)
    return _access_response(token_pair)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
    auth_service: AuthService = Depends(get_auth_service),
) -> None:
    # Revokes every token of this user, so a copied cookie stops working too.
    await auth_service.logout(refresh_token)
    response.delete_cookie(
        key=REFRESH_COOKIE,
        path=_cookie_path(request),
        httponly=True,
        samesite="strict",
        secure=_IS_PROD,
    )


@router.get("/me", response_model=AuthRegistrationResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> AuthRegistrationResponse:
    return current_user
