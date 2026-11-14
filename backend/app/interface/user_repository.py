from abc import ABC, abstractmethod
from typing import Optional

from app.models.user import User


class AbstractUserRepository(ABC):
    @abstractmethod
    async def get_by_id(self, user_id: int) -> Optional[User]: ...

    @abstractmethod
    async def get_by_google_id(self, id: int) -> Optional[User]: ...

    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]: ...

    @abstractmethod
    async def create(self, user: User) -> User: ...

    @abstractmethod
    async def delete(self, user: User) -> User: ...

    @abstractmethod
    async def update(self, user: User) -> User: ...
