from pydantic import BaseModel, Field


class AccessTokenResponse(BaseModel):
    """HTTP response body — refresh token is in the HttpOnly cookie, not here."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer")
    expires_in: int = Field(..., description="Expiration in seconds")


class TokenPair(BaseModel):
    """Internal DTO used by the service layer (never serialized to HTTP)."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    sub: str
    email: str
    full_name: str | None = None
    token_type: str
    exp: int
    iat: int


class RefreshTokenRequest(BaseModel):
    """Kept for backward-compatibility if needed elsewhere."""

    refresh_token: str
