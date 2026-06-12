"""JWT Configuration - Dependency Inversion Pattern.

This module centralizes JWT configuration, allowing easy testing
and swapping of implementations without modifying service code.
"""

import os
from datetime import timedelta

# Environment variables with sensible defaults for development
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
JWT_REFRESH_EXPIRATION_DAYS = int(os.getenv("JWT_REFRESH_EXPIRATION_DAYS", "7"))

# Token expiration deltas
ACCESS_TOKEN_EXPIRE_DELTA = timedelta(hours=JWT_EXPIRATION_HOURS)
REFRESH_TOKEN_EXPIRE_DELTA = timedelta(days=JWT_REFRESH_EXPIRATION_DAYS)

# Token types
TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"
