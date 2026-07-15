from typing import Optional, Protocol

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.user import User


class UserRepositoryProtocol(Protocol):
    async def get_by_google_id(self, id: int ) -> Optional[User]:
        ...
    async def get_by_email(self, email: str) -> Optional[User]:
        ...
    async def create(self, user: User) -> User:
        ...
    async def delete(self, user : User) -> User: 
        ...
    async def update(self, user : User) -> User: 
        ...

