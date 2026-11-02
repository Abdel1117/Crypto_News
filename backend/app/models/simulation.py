"""Tables of the logged-in simulation (one portfolio per user).

Trades are the only history that is stored: cash, positions, realized PnL and
taxes are recomputed from them (see app/services/simulation/engine.py).
Money and quantities are exact decimals, never floats.
"""

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import Column, DateTime, Numeric, UniqueConstraint
from sqlmodel import Field, SQLModel

# Precision: quantities and unit prices need many decimals (tiny-priced coins,
# fractions of a bitcoin); money amounts need fewer.
QUANTITY = Numeric(30, 12)
PRICE = Numeric(30, 12)
MONEY = Numeric(24, 8)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SimPortfolio(SQLModel, table=True):
    __tablename__ = "sim_portfolio"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True, index=True, nullable=False)
    currency: str = Field(max_length=3, nullable=False)  # "eur" or "usd"
    initial_capital: Decimal = Field(sa_column=Column(MONEY, nullable=False))
    country: str = Field(max_length=2, nullable=False)  # ISO code, see tax_rules
    # Stored per portfolio so a future change of the default fee never
    # rewrites the history of existing portfolios.
    fee_rate: Decimal = Field(
        default=Decimal("0.001"), sa_column=Column(Numeric(8, 6), nullable=False)
    )
    created_at: datetime = Field(
        default_factory=_utcnow, sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class SimTrade(SQLModel, table=True):
    __tablename__ = "sim_trade"

    id: Optional[int] = Field(default=None, primary_key=True)
    portfolio_id: int = Field(foreign_key="sim_portfolio.id", index=True, nullable=False)
    coin_id: str = Field(max_length=100, nullable=False)
    coin_symbol: str = Field(max_length=50, nullable=False)
    coin_name: str = Field(max_length=200, nullable=False)
    coin_image: str = Field(default="", max_length=500)
    side: str = Field(max_length=4, nullable=False)  # "buy" or "sell"
    quantity: Decimal = Field(sa_column=Column(QUANTITY, nullable=False))
    price: Decimal = Field(sa_column=Column(PRICE, nullable=False))
    gross: Decimal = Field(sa_column=Column(MONEY, nullable=False))  # quantity × price
    fee: Decimal = Field(sa_column=Column(MONEY, nullable=False))
    # Sells only: market value of every coin held just before the sale.
    # France's formula (art. 150 VH bis CGI) needs it.
    crypto_value_before: Optional[Decimal] = Field(
        default=None, sa_column=Column(MONEY, nullable=True)
    )
    executed_at: datetime = Field(
        default_factory=_utcnow, sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class SimSnapshot(SQLModel, table=True):
    """Portfolio value at the end of a day (the last value computed that day)."""

    __tablename__ = "sim_snapshot"
    __table_args__ = (UniqueConstraint("portfolio_id", "day", name="uq_sim_snapshot_day"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    portfolio_id: int = Field(foreign_key="sim_portfolio.id", index=True, nullable=False)
    day: date = Field(nullable=False)
    total_value: Decimal = Field(sa_column=Column(MONEY, nullable=False))
    cash: Decimal = Field(sa_column=Column(MONEY, nullable=False))
