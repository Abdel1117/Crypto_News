
from typing import Optional

from sqlmodel import col, or_, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.repositories.users.user_repository import UserRepositoryProtocol
from app.models.user import User

class SQLUserRepository(UserRepositoryProtocol):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_google_id(self, id):
        statement = select(User).where(User.google_id == id)
        result = await self.session.execute(statement)
        return result.scalars().one_or_none()
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        return await self.session.get(User, user_id)

    async def search(self, query: str, limit: int = 20) -> list[User]:
        """Users whose email or name contains `query` (any case), oldest first."""
        statement = select(User).order_by(User.id).limit(limit)
        if query:
            pattern = f"%{query.lower()}%"
            statement = statement.where(
                or_(col(User.email).ilike(pattern), col(User.full_name).ilike(pattern))
            )
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def get_by_email(self, email: str) -> Optional[User]:
        statement = select(User).where(User.email == email)
        result = await self.session.execute(statement)
        return result.scalars().one_or_none()

    async def _save(self, user: User) -> User:
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def create(self, user: User) -> User:
        return await self._save(user)

    async def update(self, user: User) -> User:
        return await self._save(user)

    async def delete(self, user: User) -> User:
        await self.session.delete(user)
        await self.session.commit()
        return user
