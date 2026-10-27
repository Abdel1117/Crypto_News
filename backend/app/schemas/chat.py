from typing import Literal

from pydantic import BaseModel, Field

MAX_MESSAGE_CHARS = 2000
MAX_MESSAGES = 50
MAX_WATCHLIST = 50
MAX_HOLDINGS = 50

# CoinGecko ids are lowercase letters, digits and dashes.
COIN_ID_PATTERN = r"^[a-z0-9][a-z0-9-]{0,99}$"


class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=MAX_MESSAGE_CHARS * 4)


class HoldingIn(BaseModel):
    # Ids that don't match COIN_ID_PATTERN are dropped later, not rejected,
    # so one odd holding can't block the whole chat request.
    coin_id: str = Field(max_length=100)
    symbol: str = Field(max_length=50)
    amount: float
    avg_buy_price: float


class PortfolioIn(BaseModel):
    balance: float
    initial_balance: float
    realized_pnl: float = 0
    holdings: list[HoldingIn] = Field(default_factory=list, max_length=MAX_HOLDINGS)


class ChatRequest(BaseModel):
    messages: list[ChatMessageIn] = Field(min_length=1, max_length=MAX_MESSAGES)
    currency: Literal["eur", "usd"] = "eur"
    watchlist: list[str] = Field(default_factory=list, max_length=MAX_WATCHLIST)
    portfolio: PortfolioIn | None = None


class ChatUsageOut(BaseModel):
    used: int
    limit: int
    remaining: int
    # False when the server has no Claude API key: the widget shows a notice.
    available: bool
