from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.simulation import COIN_ID_PATTERN, PortfolioCurrency

AlertDirection = Literal["above", "below"]
# The column is Numeric(30, 12): 18 digits at most before the decimal point.
MAX_THRESHOLD = Decimal("1e18")


class AlertCreate(BaseModel):
    coin_id: str = Field(pattern=COIN_ID_PATTERN)
    currency: PortfolioCurrency
    direction: AlertDirection
    threshold: Decimal = Field(gt=0, lt=MAX_THRESHOLD, max_digits=30, decimal_places=12)


class AlertUpdate(BaseModel):
    is_active: bool


class AlertOut(BaseModel):
    id: int
    coin_id: str
    symbol: str
    name: str
    image: str
    currency: PortfolioCurrency
    direction: AlertDirection
    threshold: float
    is_active: bool
    created_at: datetime
    triggered_at: datetime | None
    triggered_price: float | None


class AlertsOverview(BaseModel):
    items: list[AlertOut]
    email: str
    email_verified: bool
    alerts_available: bool  # false when the server can't check or email alerts
    max_alerts: int
    check_interval_seconds: int


class EmailTokenIn(BaseModel):
    token: str = Field(min_length=1, max_length=2000)


class UnsubscribeOut(BaseModel):
    deactivated: int


class EmailVerificationOut(BaseModel):
    email_verified: bool
