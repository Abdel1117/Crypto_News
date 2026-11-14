from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, model_validator

CountryCode = Literal["FR", "BE", "CH", "DE", "ES", "IT", "GB", "US"]
PortfolioCurrency = Literal["eur", "usd"]

MIN_CAPITAL = Decimal("1000")
MAX_CAPITAL = Decimal("50000")
# Same rule as the market routes: no slash, so the id can't change the CoinGecko path.
COIN_ID_PATTERN = r"^[a-z0-9][a-z0-9._-]{0,99}$"


# ---------- requests ----------

class PortfolioCreate(BaseModel):
    initial_capital: Decimal = Field(ge=MIN_CAPITAL, le=MAX_CAPITAL, decimal_places=2)
    currency: PortfolioCurrency
    country: CountryCode


class PortfolioUpdate(BaseModel):
    country: CountryCode


class TradeCreate(BaseModel):
    coin_id: str = Field(pattern=COIN_ID_PATTERN)
    side: Literal["buy", "sell"]
    # Exactly one of the two. `amount` is the money to spend, fee included
    # (buys only), so "Max" still works when the price moves a little.
    quantity: Decimal | None = Field(default=None, gt=0, max_digits=30, decimal_places=12)
    amount: Decimal | None = Field(default=None, gt=0, max_digits=20, decimal_places=8)

    @model_validator(mode="after")
    def one_of_quantity_or_amount(self):
        if (self.quantity is None) == (self.amount is None):
            raise ValueError("Indique soit une quantité, soit un montant.")
        if self.side == "sell" and self.amount is not None:
            raise ValueError("Une vente s'indique en quantité.")
        return self


# ---------- responses ----------

class SourceOut(BaseModel):
    label: str
    url: str


class CountryOut(BaseModel):
    code: CountryCode
    name: str
    default_currency: PortfolioCurrency
    summary: str
    notes: list[str]
    sources: list[SourceOut]
    verified_on: date


class PositionOut(BaseModel):
    coin_id: str
    symbol: str
    name: str
    image: str
    quantity: float
    avg_cost: float
    cost: float
    price: float
    price_stale: bool  # no live price: last trade price used
    value: float
    pnl: float
    pnl_percent: float
    share: float  # % of the total portfolio value


class PnlOut(BaseModel):
    total: float
    total_percent: float
    realized: float
    unrealized: float
    after_tax: float


class TaxYearOut(BaseModel):
    year: str
    sales_total: float
    net_gain: float
    short_term_gain: float
    long_term_gain: float
    taxable_gain: float
    exempt: bool
    tax: float


class TaxOut(BaseModel):
    country: CountryCode
    years: list[TaxYearOut]
    total: float
    fx_estimated: bool  # exemption amounts converted with an approximate rate


class RiskOut(BaseModel):
    max_drawdown: float | None
    volatility: float | None
    days: int


class SaleOut(BaseModel):
    trade_id: int
    symbol: str
    realized_pnl: float
    executed_at: datetime


class TradeStatsOut(BaseModel):
    trades_count: int
    sells_count: int
    win_rate: float | None
    best_sale: SaleOut | None
    worst_sale: SaleOut | None
    avg_holding_days: float | None
    total_fees: float


class HistoryPoint(BaseModel):
    day: date
    value: float


class PortfolioOut(BaseModel):
    id: int
    currency: PortfolioCurrency
    country: CountryCode
    initial_capital: float
    fee_rate: float
    created_at: datetime
    cash: float
    holdings_value: float
    total_value: float
    positions: list[PositionOut]
    pnl: PnlOut
    tax: TaxOut
    risk: RiskOut
    stats: TradeStatsOut
    history: list[HistoryPoint]  # one value per day, today included


class TradeOut(BaseModel):
    id: int
    coin_id: str
    symbol: str
    name: str
    image: str
    side: Literal["buy", "sell"]
    quantity: float
    price: float
    gross: float
    fee: float
    total: float  # cash out for a buy (gross + fee), cash in for a sell (gross − fee)
    realized_pnl: float | None  # sells: on the average cost
    taxable_gain: float | None  # sells: with the country's method
    executed_at: datetime


class TradesPage(BaseModel):
    items: list[TradeOut]
    total: int


class QuotesOut(BaseModel):
    """Live prices of the coins held, for the real-time display (read-only)."""

    prices: dict[str, float]  # coin id → price in the portfolio's currency
    stale: list[str]  # coins held but without a live price
    at: datetime
