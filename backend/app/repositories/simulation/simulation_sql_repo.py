from datetime import date
from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.simulation import SimPortfolio, SimSnapshot, SimTrade


class SQLSimulationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_portfolio(self, user_id: int, lock: bool = False) -> SimPortfolio | None:
        statement = select(SimPortfolio).where(SimPortfolio.user_id == user_id)
        if lock:
            # Serializes trades of one portfolio (ignored by SQLite).
            statement = statement.with_for_update()
        result = await self.session.execute(statement)
        return result.scalars().one_or_none()

    async def list_portfolios(self) -> list[SimPortfolio]:
        result = await self.session.execute(select(SimPortfolio))
        return list(result.scalars().all())

    async def add(self, row) -> None:
        self.session.add(row)
        await self.session.flush()

    async def list_trades(self, portfolio_id: int) -> list[SimTrade]:
        result = await self.session.execute(
            select(SimTrade)
            .where(SimTrade.portfolio_id == portfolio_id)
            .order_by(SimTrade.executed_at, SimTrade.id)
        )
        return list(result.scalars().all())

    async def list_snapshots(self, portfolio_id: int) -> list[SimSnapshot]:
        result = await self.session.execute(
            select(SimSnapshot)
            .where(SimSnapshot.portfolio_id == portfolio_id)
            .order_by(SimSnapshot.day)
        )
        return list(result.scalars().all())

    async def delete_history(self, portfolio_id: int) -> None:
        await self.session.execute(delete(SimTrade).where(SimTrade.portfolio_id == portfolio_id))
        await self.session.execute(
            delete(SimSnapshot).where(SimSnapshot.portfolio_id == portfolio_id)
        )

    async def upsert_snapshot(
        self, portfolio_id: int, day: date, total_value: Decimal, cash: Decimal
    ) -> None:
        """Today's row holds the last value computed today (the day's close)."""
        for _ in range(2):
            result = await self.session.execute(
                select(SimSnapshot).where(
                    SimSnapshot.portfolio_id == portfolio_id, SimSnapshot.day == day
                )
            )
            snapshot = result.scalars().one_or_none()
            if snapshot is None:
                snapshot = SimSnapshot(
                    portfolio_id=portfolio_id, day=day, total_value=total_value, cash=cash
                )
                self.session.add(snapshot)
            else:
                snapshot.total_value = total_value
                snapshot.cash = cash
            try:
                await self.session.commit()
                return
            except IntegrityError:
                # Another request created today's row first: update it instead.
                await self.session.rollback()
        raise RuntimeError("Could not record the portfolio snapshot")

    async def commit(self) -> None:
        await self.session.commit()
