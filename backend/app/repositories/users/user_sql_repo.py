
from typing import Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.repositories.users.user_repository import UserRepositoryProtocol
from app.models.user import User

class SQLUserRepository(UserRepositoryProtocol):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_email(self, email: str) -> Optional[User]:
        statement = select(User).where(User.email == email)
        result = await self.session.execute(statement)
        return result.scalars().one_or_none()

    async def create(self, user: User) -> User:
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user
