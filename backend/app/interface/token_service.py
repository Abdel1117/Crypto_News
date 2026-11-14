from abc import ABC, abstractmethod

from app.schemas.token import TokenPayload


class AbstractTokenService(ABC):
    @abstractmethod
    def create_access_token(
        self, user_id: str, email: str, full_name: str | None = None, token_version: int = 0,
        role: str = "user",
    ) -> str: ...

    @abstractmethod
    def create_refresh_token(
        self, user_id: str, email: str, full_name: str | None = None, token_version: int = 0,
        role: str = "user",
    ) -> str: ...

    @abstractmethod
    def verify_token(self, token: str) -> TokenPayload: ...
