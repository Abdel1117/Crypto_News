from typing import Protocol

from app.schemas.token import TokenPayload


class TokenServiceProtocol(Protocol):
    def create_access_token(self, user_id: str, email: str) -> str: ...

    def create_refresh_token(self, user_id: str, email: str) -> str: ...

    def verify_token(self, token: str) -> TokenPayload: ...
