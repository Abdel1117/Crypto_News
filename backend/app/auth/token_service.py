from typing import Protocol

from app.schemas.token import TokenPayload


class TokenServiceProtocol(Protocol):
    def create_access_token(self, user_id: str, email: str, full_name: str | None = None) -> str: ...

    def create_refresh_token(self, user_id: str, email: str, full_name: str | None = None) -> str: ...

    def verify_token(self, token: str) -> TokenPayload: ...
