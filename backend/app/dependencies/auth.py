import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.jwt_config import TOKEN_TYPE_ACCESS
from app.db.session import get_session
from app.models.user import User
from app.repositories.users.user_sql_repo import SQLUserRepository
from app.auth.jwt_token_service import JWTTokenService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

_token_service = JWTTokenService()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = _token_service.verify_token(token)
    except jwt.InvalidTokenError:
        raise credentials_exception

    if payload.token_type != TOKEN_TYPE_ACCESS:
        raise credentials_exception

    user = await SQLUserRepository(session).get_by_email(payload.email)
    if user is None or not user.is_active:
        raise credentials_exception

    return user
