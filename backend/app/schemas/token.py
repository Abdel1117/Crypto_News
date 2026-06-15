"""Token schemas - Type-safe data structures for JWT operations.

Follows Pydantic pattern already used in the project.
Separates API contracts from business logic.
"""

from pydantic import BaseModel, Field


class TokenResponse(BaseModel):
    """Access token response schema."""

    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type (always 'bearer')")
    expires_in: int = Field(..., description="Token expiration time in seconds")

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 86400, # 24H 
            }
        }


class TokenPayload(BaseModel):
    """JWT token payload structure."""

    sub: str = Field(..., description="Subject (user ID)")
    email: str = Field(..., description="User email")
    full_name: str | None = Field(default=None, description="User full name")
    token_type: str = Field(..., description="Token type (access or refresh)")
    exp: int = Field(..., description="Expiration timestamp")
    iat: int = Field(..., description="Issued at timestamp")


class RefreshTokenRequest(BaseModel):
    """Request body for token refresh."""

    refresh_token: str = Field(..., description="Refresh token from login response")
