from typing import Optional, Protocol

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.user import User


class UserRepositoryProtocol(Protocol):
    async def get_by_email(self, email: str) -> Optional[User]:
        pass

    async def create(self, user: User) -> User:
        pass
    
    async def delete(self, user : User) -> User: 
        pass
    
    async def update(self, user : User) -> User: 
        pass

