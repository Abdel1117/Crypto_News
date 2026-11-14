from datetime import datetime
from decimal import Decimal

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.price_alert import PriceAlert
from app.models.user import User


class SQLPriceAlertRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_for_user(self, user_id: int) -> list[PriceAlert]:
        result = await self.session.execute(
            select(PriceAlert)
            .where(PriceAlert.user_id == user_id)
            .order_by(PriceAlert.created_at.desc(), PriceAlert.id.desc())
        )
        return list(result.scalars().all())

    async def count_for_user(self, user_id: int) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(PriceAlert).where(PriceAlert.user_id == user_id)
        )
        return result.scalar_one()

    async def get_for_user(self, alert_id: int, user_id: int) -> PriceAlert | None:
        result = await self.session.execute(
            select(PriceAlert).where(PriceAlert.id == alert_id, PriceAlert.user_id == user_id)
        )
        return result.scalars().one_or_none()

    async def add(self, alert: PriceAlert) -> None:
        self.session.add(alert)
        await self.session.flush()

    async def delete(self, alert: PriceAlert) -> None:
        await self.session.delete(alert)

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()

    async def list_deliverable(self) -> list[tuple[PriceAlert, str]]:
        """Active alerts with their owner's email, for accounts that can receive them."""
        result = await self.session.execute(
            select(PriceAlert, User.email)
            .join(User, PriceAlert.user_id == User.id)
            .where(
                PriceAlert.is_active.is_(True),
                User.is_active.is_(True),
                User.email_verified_at.is_not(None),
            )
        )
        return [(alert, email) for alert, email in result.all()]

    async def claim(self, alert_id: int, price: Decimal, at: datetime) -> bool:
        """Marks an alert as fired. False if it was no longer active, so only one
        caller ever gets to send its email."""
        result = await self.session.execute(
            update(PriceAlert)
            .where(PriceAlert.id == alert_id, PriceAlert.is_active.is_(True))
            .values(is_active=False, triggered_at=at, triggered_price=price)
            .execution_options(synchronize_session=False)
        )
        await self.session.commit()
        return result.rowcount == 1

    async def release(self, alert_id: int) -> None:
        """Undoes a claim whose email couldn't be sent, so the next check retries it."""
        await self.session.execute(
            update(PriceAlert)
            .where(PriceAlert.id == alert_id)
            .values(is_active=True, triggered_at=None, triggered_price=None)
            .execution_options(synchronize_session=False)
        )
        await self.session.commit()

    async def deactivate_all(self, user_id: int) -> int:
        result = await self.session.execute(
            update(PriceAlert)
            .where(PriceAlert.user_id == user_id, PriceAlert.is_active.is_(True))
            .values(is_active=False)
            .execution_options(synchronize_session=False)
        )
        await self.session.commit()
        return result.rowcount
