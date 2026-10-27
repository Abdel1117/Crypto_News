from typing import Protocol

from app.schemas.token import TokenPayload


class TokenServiceProtocol(Protocol):
    def create_access_token(
        self, user_id: str, email: str, full_name: str | None = None, token_version: int = 0
    ) -> str: ...

    def create_refresh_token(
        self, user_id: str, email: str, full_name: str | None = None, token_version: int = 0
    ) -> str: ...

    def verify_token(self, token: str) -> TokenPayload: ...
