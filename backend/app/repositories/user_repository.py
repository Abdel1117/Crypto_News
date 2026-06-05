from typing import Optional, Protocol

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.user import User


class UserRepositoryProtocol(Protocol):
    async def get_by_email(self, email: str) -> Optional[User]:
        ...

    async def create(self, user: User) -> User:
        ...


class SQLUserRepository(UserRepositoryProtocol):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_email(self, email: str) -> Optional[User]:
        statement = select(User).where(User.email == email)
        result = await self.session.execute(statement)
        return result.one_or_none()

    async def create(self, user: User) -> User:
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user
