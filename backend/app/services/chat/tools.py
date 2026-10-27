"""Market-data tools the chatbot can call.

Each tool is a thin wrapper over the existing services, so the bot reads the
same CoinGecko data (and the same 30 s client cache) as the dashboard.
"""

import json
from typing import Any, Awaitable, Callable

import httpx

from app.services.market_service import MarketService
from app.services.symbols_service import SymbolesService
from app.services.trending_service import TrendingService
from app.utils.mapping_values.mapping_values import convert_Time_Frame

CURRENCIES = ["eur", "usd"]
TIMEFRAMES = ["1d", "1w", "1m", "1y"]
MAX_TOP_MARKETS = 50
MOVERS_UNIVERSE = 100  # movers are picked among the top 100 coins by market cap
MOVERS_PER_SIDE = 5


class ToolInputError(ValueError):
    """The model sent arguments that don't match the tool schema."""


def _tool(name: str, description: str, properties: dict, required: list[str]) -> dict:
    return {
        "name": name,
        "description": description,
        # Inputs stream as they are generated; we validate them ourselves below.
        "eager_input_streaming": True,
        "input_schema": {
            "type": "object",
            "properties": properties,
            "required": required,
            "additionalProperties": False,
        },
    }


_CURRENCY = {"type": "string", "enum": CURRENCIES, "description": "Quote currency."}
_COIN_ID = {
    "type": "string",
    "description": "CoinGecko coin id, e.g. 'bitcoin', 'ethereum', 'solana'. "
    "Use search_coin first if you only know a name or ticker.",
}

# Kept in a fixed order so the request prefix stays cacheable.
TOOL_DEFINITIONS: list[dict] = [
    _tool(
        "search_coin",
        "Find CoinGecko coin ids from a name or ticker (e.g. 'sol', 'cardano').",
        {"query": {"type": "string", "description": "Name or ticker to look up."}},
        ["query"],
    ),
    _tool(
        "get_coin",
        "Current price, market cap, 24h volume and 24h % change for one coin.",
        {"coin_id": _COIN_ID, "currency": _CURRENCY},
        ["coin_id", "currency"],
    ),
    _tool(
        "get_top_markets",
        "The largest coins by market cap with price and 24h % change.",
        {
            "currency": _CURRENCY,
            "limit": {
                "type": "integer",
                "minimum": 1,
                "maximum": MAX_TOP_MARKETS,
                "description": "How many coins to return.",
            },
        },
        ["currency", "limit"],
    ),
    _tool(
        "get_top_movers",
        f"Biggest 24h gainers and losers among the top {MOVERS_UNIVERSE} coins.",
        {"currency": _CURRENCY},
        ["currency"],
    ),
    _tool(
        "get_global_market",
        "Global crypto market: total market cap, volume, Bitcoin dominance, 24h changes.",
        {"currency": _CURRENCY},
        ["currency"],
    ),
    _tool(
        "get_price_history",
        "Open, close, high, low and % change of one coin over a period.",
        {
            "coin_id": _COIN_ID,
            "currency": _CURRENCY,
            "timeframe": {
                "type": "string",
                "enum": TIMEFRAMES,
                "description": "1d = day, 1w = week, 1m = month, 1y = year.",
            },
        },
        ["coin_id", "currency", "timeframe"],
    ),
    _tool(
        "get_trending",
        "Coins currently trending in searches on CoinGecko.",
        {},
        [],
    ),
]

_SCHEMAS = {t["name"]: t["input_schema"] for t in TOOL_DEFINITIONS}


def validate_input(name: str, args: Any) -> dict:
    """Checks tool arguments against the schema. Raises ToolInputError."""
    schema = _SCHEMAS.get(name)
    if schema is None:
        raise ToolInputError(f"Unknown tool: {name}")
    if not isinstance(args, dict):
        raise ToolInputError("Arguments must be a JSON object.")

    props = schema["properties"]
    unknown = set(args) - set(props)
    if unknown:
        raise ToolInputError(f"Unknown arguments: {sorted(unknown)}")
    missing = [key for key in schema["required"] if key not in args]
    if missing:
        raise ToolInputError(f"Missing arguments: {missing}")

    for key, value in args.items():
        spec = props[key]
        if spec["type"] == "string":
            if not isinstance(value, str) or not value.strip():
                raise ToolInputError(f"'{key}' must be a non-empty string.")
            if "enum" in spec and value not in spec["enum"]:
                raise ToolInputError(f"'{key}' must be one of {spec['enum']}.")
        elif spec["type"] == "integer":
            if isinstance(value, bool) or not isinstance(value, int):
                raise ToolInputError(f"'{key}' must be an integer.")
            if not spec["minimum"] <= value <= spec["maximum"]:
                raise ToolInputError(
                    f"'{key}' must be between {spec['minimum']} and {spec['maximum']}."
                )
    return args


def _summarize_ohlc(candles: list) -> dict | None:
    """CoinGecko OHLC rows are [timestamp, open, high, low, close]."""
    rows = [c for c in candles if isinstance(c, (list, tuple)) and len(c) >= 5]
    if not rows:
        return None
    first_open = rows[0][1]
    last_close = rows[-1][4]
    change = (last_close - first_open) / first_open * 100 if first_open else None
    return {
        "open": first_open,
        "close": last_close,
        "high": max(r[2] for r in rows),
        "low": min(r[3] for r in rows),
        "change_pct": round(change, 2) if change is not None else None,
        "from_ts": rows[0][0],
        "to_ts": rows[-1][0],
    }


class ChatTools:
    def __init__(
        self,
        market: MarketService,
        trending: TrendingService,
        symbols: SymbolesService,
    ) -> None:
        self.market = market
        self.trending = trending
        self.symbols = symbols
        self._handlers: dict[str, Callable[..., Awaitable[Any]]] = {
            "search_coin": self._search_coin,
            "get_coin": self._get_coin,
            "get_top_markets": self._get_top_markets,
            "get_top_movers": self._get_top_movers,
            "get_global_market": self._get_global_market,
            "get_price_history": self._get_price_history,
            "get_trending": self._get_trending,
        }

    async def run(self, name: str, args: Any) -> tuple[str, bool]:
        """Runs one tool call. Returns (content, is_error) for the tool_result block."""
        try:
            valid = validate_input(name, args)
            result = await self._handlers[name](**valid)
            return json.dumps(result, ensure_ascii=False, default=str), False
        except ToolInputError as exc:
            return f"Invalid input: {exc}", True
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 429:
                return "Market data provider is rate-limited. Try again shortly.", True
            if exc.response.status_code == 404:
                return "Not found on the market data provider. Check the coin id.", True
            return "Market data provider error.", True
        except httpx.HTTPError:
            return "Market data provider is unreachable.", True

    async def _search_coin(self, query: str):
        return await self.symbols.search_symbols(query, per_page=5)

    async def _get_coin(self, coin_id: str, currency: str):
        coin = await self.market.get_market_by_id(currency, coin_id)
        if coin is None:
            raise ToolInputError(f"No coin with id '{coin_id}'. Use search_coin.")
        coin.pop("image", None)
        return coin

    async def _get_top_markets(self, currency: str, limit: int):
        coins = await self.market.get_top_markets(currency, "market_cap_desc", limit, 1)
        for coin in coins:
            coin.pop("image", None)
        return coins

    async def _get_top_movers(self, currency: str):
        data = await self.market.get_top_gainers_losers(
            currency, "1d", "1d", str(MOVERS_UNIVERSE)
        )

        def slim(coin: dict) -> dict:
            return {
                "id": coin.get("id"),
                "symbol": coin.get("symbol"),
                "name": coin.get("name"),
                "price": coin.get("price"),
                "change_24h": coin.get("price_change_percentage"),
            }

        return {
            "top_gainers": [slim(c) for c in data["top_gainers"][:MOVERS_PER_SIDE]],
            "top_losers": [slim(c) for c in data["top_losers"][:MOVERS_PER_SIDE]],
        }

    async def _get_global_market(self, currency: str):
        return await self.market.get_market_view(currency)

    async def _get_price_history(self, coin_id: str, currency: str, timeframe: str):
        candles = await self.market.get_ohlc(
            currency, convert_Time_Frame(timeframe), coin_id
        )
        summary = _summarize_ohlc(candles or [])
        if summary is None:
            raise ToolInputError(f"No price history for '{coin_id}'.")
        return {"coin_id": coin_id, "currency": currency, "timeframe": timeframe, **summary}

    async def _get_trending(self):
        coins = await self.trending.get_trending_coins()
        return [
            {
                "id": c["id"],
                "name": c["name"],
                "symbol": c["symbol"],
                "market_cap_rank": c.get("market_cap_rank"),
                "price_usd": c.get("price"),
                "change_24h_usd": c.get("price_change_24h"),
            }
            for c in coins
        ]
