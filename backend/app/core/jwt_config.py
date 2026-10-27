"""JWT Configuration - Dependency Inversion Pattern.

This module centralizes JWT configuration, allowing easy testing
and swapping of implementations without modifying service code.
"""

import os
from datetime import timedelta

DEV_SECRET_KEY = "dev-secret-key-change-in-production"
MIN_SECRET_LENGTH = 32

# Environment variables with sensible defaults for development
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", DEV_SECRET_KEY)


def check_jwt_secret(env: str | None, secret: str) -> None:
    """Refuses to run production with a missing, default or short signing key.

    Anyone who knows the key can forge tokens for any account, and the dev
    default is public in this repository.
    """
    if env != "production":
        return
    if secret == DEV_SECRET_KEY or len(secret) < MIN_SECRET_LENGTH:
        raise RuntimeError(
            f"JWT_SECRET_KEY must be set to a random value of at least "
            f"{MIN_SECRET_LENGTH} characters in production."
        )
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "15"))
JWT_REFRESH_EXPIRATION_DAYS = int(os.getenv("JWT_REFRESH_EXPIRATION_DAYS", "7"))
# Token expiration deltas
ACCESS_TOKEN_EXPIRE_DELTA = timedelta(minutes=JWT_EXPIRATION_MINUTES)
REFRESH_TOKEN_EXPIRE_DELTA = timedelta(days=JWT_REFRESH_EXPIRATION_DAYS)

# Token types
TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"
