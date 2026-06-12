from datetime import datetime, timedelta, timezone

import jwt

from app.core.jwt_config import (
    ACCESS_TOKEN_EXPIRE_DELTA,
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
    REFRESH_TOKEN_EXPIRE_DELTA,
    TOKEN_TYPE_ACCESS,
    TOKEN_TYPE_REFRESH,
)
from app.schemas.token import TokenPayload


class JWTTokenService:
    def __init__(self, secret_key: str = JWT_SECRET_KEY, algorithm: str = JWT_ALGORITHM):
        self.secret_key = secret_key
        self.algorithm = algorithm

    def _create_token(
        self, user_id: str, email: str, token_type: str, expires_delta: timedelta
    ) -> str:
        now = datetime.now(timezone.utc)
        expires = now + expires_delta
        payload = {
            "sub": user_id,
            "email": email,
            "token_type": token_type,
            "iat": int(now.timestamp()),
            "exp": int(expires.timestamp()),
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def create_access_token(self, user_id: str, email: str) -> str:
        return self._create_token(user_id, email, TOKEN_TYPE_ACCESS, ACCESS_TOKEN_EXPIRE_DELTA)

    def create_refresh_token(self, user_id: str, email: str) -> str:
        return self._create_token(user_id, email, TOKEN_TYPE_REFRESH, REFRESH_TOKEN_EXPIRE_DELTA)

    def verify_token(self, token: str) -> TokenPayload:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return TokenPayload(**payload)
        except jwt.ExpiredSignatureError as e:
            raise jwt.InvalidTokenError("Token has expired") from e
        except jwt.InvalidTokenError as e:
            raise jwt.InvalidTokenError("Invalid token") from e
