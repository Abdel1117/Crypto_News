"""Price alerts: an email when a coin goes above or below a chosen price."""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import Column, DateTime, Numeric, UniqueConstraint
from sqlmodel import Field, SQLModel

from app.utils.dates import utcnow

# Same precision as the simulation's prices: tiny-priced coins need many decimals.
PRICE = Numeric(30, 12)


class PriceAlert(SQLModel, table=True):
    __tablename__ = "price_alert"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "coin_id", "currency", "direction", "threshold", name="uq_price_alert_rule"
        ),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    coin_id: str = Field(max_length=100, nullable=False)
    coin_symbol: str = Field(max_length=50, nullable=False)
    coin_name: str = Field(max_length=200, nullable=False)
    coin_image: str = Field(default="", max_length=500)
    currency: str = Field(max_length=3, nullable=False)  # "eur" or "usd"
    direction: str = Field(max_length=5, nullable=False)  # "above" or "below"
    threshold: Decimal = Field(sa_column=Column(PRICE, nullable=False))
    # An alert fires once, then stays off until its owner turns it back on, so a
    # price moving back and forth around the threshold can't send a flood of emails.
    is_active: bool = Field(default=True, index=True, nullable=False)
    created_at: datetime = Field(
        default_factory=utcnow, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    triggered_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    triggered_price: Optional[Decimal] = Field(default=None, sa_column=Column(PRICE, nullable=True))
