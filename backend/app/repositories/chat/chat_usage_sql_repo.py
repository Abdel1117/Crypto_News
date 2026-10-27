from datetime import date

from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.chat_usage import ChatUsage


class SQLChatUsageRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _get(self, user_id: int, day: date) -> ChatUsage | None:
        statement = select(ChatUsage).where(
            ChatUsage.user_id == user_id, ChatUsage.day == day
        )
        result = await self.session.exec(statement)
        return result.one_or_none()

    async def get_count(self, user_id: int, day: date) -> int:
        usage = await self._get(user_id, day)
        return usage.count if usage else 0

    async def increment(self, user_id: int, day: date) -> int:
        """Adds one message to the user's count for `day` and returns the new count."""
        usage = await self._get(user_id, day)
        if usage is None:
            usage = ChatUsage(user_id=user_id, day=day, count=1)
            self.session.add(usage)
            try:
                await self.session.commit()
                return 1
            except IntegrityError:
                # Another request created today's row first: count on it instead.
                await self.session.rollback()
                usage = await self._get(user_id, day)
                if usage is None:
                    raise

        usage.count += 1
        self.session.add(usage)
        await self.session.commit()
        return usage.count
