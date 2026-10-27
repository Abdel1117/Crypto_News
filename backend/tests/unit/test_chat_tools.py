import json
from unittest.mock import AsyncMock

import httpx
import pytest

from app.services.chat.tools import (
    TOOL_DEFINITIONS,
    ChatTools,
    ToolInputError,
    _summarize_ohlc,
    validate_input,
)


@pytest.fixture
def market():
    return AsyncMock()


@pytest.fixture
def trending():
    return AsyncMock()


@pytest.fixture
def symbols():
    return AsyncMock()


@pytest.fixture
def tools(market, trending, symbols):
    return ChatTools(market, trending, symbols)


def http_error(status: int) -> httpx.HTTPStatusError:
    request = httpx.Request("GET", "https://api.coingecko.com")
    return httpx.HTTPStatusError(
        "error", request=request, response=httpx.Response(status, request=request)
    )


class TestToolDefinitions:
    def test_every_tool_has_a_handler(self, tools):
        assert {t["name"] for t in TOOL_DEFINITIONS} == set(tools._handlers)

    def test_names_are_unique(self):
        names = [t["name"] for t in TOOL_DEFINITIONS]
        assert len(names) == len(set(names))


class TestValidateInput:
    def test_accepts_valid_input(self):
        args = {"coin_id": "bitcoin", "currency": "eur"}
        assert validate_input("get_coin", args) == args

    @pytest.mark.parametrize(
        "name,args",
        [
            ("nope", {}),
            ("get_coin", "bitcoin"),
            ("get_coin", {"coin_id": "bitcoin"}),
            ("get_coin", {"coin_id": "bitcoin", "currency": "gbp"}),
            ("get_coin", {"coin_id": "", "currency": "eur"}),
            ("get_coin", {"coin_id": "bitcoin", "currency": "eur", "x": 1}),
            ("get_top_markets", {"currency": "eur", "limit": 0}),
            ("get_top_markets", {"currency": "eur", "limit": 500}),
            ("get_top_markets", {"currency": "eur", "limit": "10"}),
            ("get_top_markets", {"currency": "eur", "limit": True}),
        ],
    )
    def test_rejects_invalid_input(self, name, args):
        with pytest.raises(ToolInputError):
            validate_input(name, args)


class TestSummarizeOhlc:
    def test_summarizes_candles(self):
        candles = [[1, 100, 110, 90, 105], [2, 105, 130, 100, 120]]
        summary = _summarize_ohlc(candles)
        assert summary["open"] == 100
        assert summary["close"] == 120
        assert summary["high"] == 130
        assert summary["low"] == 90
        assert summary["change_pct"] == 20.0

    def test_returns_none_without_candles(self):
        assert _summarize_ohlc([]) is None


class TestRun:
    async def test_get_coin_strips_image(self, tools, market):
        market.get_market_by_id.return_value = {"id": "bitcoin", "price": 1, "image": "x"}
        content, is_error = await tools.run("get_coin", {"coin_id": "bitcoin", "currency": "eur"})
        assert not is_error
        assert json.loads(content) == {"id": "bitcoin", "price": 1}
        market.get_market_by_id.assert_awaited_once_with("eur", "bitcoin")

    async def test_unknown_coin_is_an_error(self, tools, market):
        market.get_market_by_id.return_value = None
        content, is_error = await tools.run("get_coin", {"coin_id": "nope", "currency": "eur"})
        assert is_error
        assert "search_coin" in content

    async def test_invalid_input_is_an_error(self, tools, market):
        content, is_error = await tools.run("get_coin", {"coin_id": "bitcoin"})
        assert is_error
        market.get_market_by_id.assert_not_called()

    async def test_rate_limit_is_an_error(self, tools, market):
        market.get_market_view.side_effect = http_error(429)
        content, is_error = await tools.run("get_global_market", {"currency": "usd"})
        assert is_error
        assert "rate-limited" in content

    async def test_network_failure_is_an_error(self, tools, trending):
        trending.get_trending_coins.side_effect = httpx.ConnectError("down")
        content, is_error = await tools.run("get_trending", {})
        assert is_error

    async def test_top_markets(self, tools, market):
        market.get_top_markets.return_value = [{"id": "bitcoin", "image": "x"}]
        content, _ = await tools.run("get_top_markets", {"currency": "eur", "limit": 3})
        assert json.loads(content) == [{"id": "bitcoin"}]
        market.get_top_markets.assert_awaited_once_with("eur", "market_cap_desc", 3, 1)

    async def test_top_movers_keeps_five_slim_coins(self, tools, market):
        coin = {"id": "a", "symbol": "A", "name": "A", "price": 1,
                "price_change_percentage": 9, "sparkline": [1, 2], "image": "x"}
        market.get_top_gainers_losers.return_value = {
            "top_gainers": [coin] * 10, "top_losers": [coin] * 10,
        }
        content, _ = await tools.run("get_top_movers", {"currency": "eur"})
        data = json.loads(content)
        assert len(data["top_gainers"]) == 5
        assert data["top_losers"][0] == {
            "id": "a", "symbol": "A", "name": "A", "price": 1, "change_24h": 9,
        }

    async def test_price_history_maps_timeframe(self, tools, market):
        market.get_ohlc.return_value = [[1, 100, 110, 90, 105], [2, 105, 130, 100, 110]]
        content, is_error = await tools.run(
            "get_price_history", {"coin_id": "bitcoin", "currency": "eur", "timeframe": "1w"}
        )
        assert not is_error
        assert json.loads(content)["change_pct"] == 10.0
        market.get_ohlc.assert_awaited_once_with("eur", 7, "bitcoin")

    async def test_search_coin(self, tools, symbols):
        symbols.search_symbols.return_value = [{"id": "solana"}]
        content, _ = await tools.run("search_coin", {"query": "sol"})
        assert json.loads(content) == [{"id": "solana"}]
        symbols.search_symbols.assert_awaited_once_with("sol", per_page=5)

    async def test_trending_is_slimmed(self, tools, trending):
        trending.get_trending_coins.return_value = [
            {"id": "pepe", "name": "Pepe", "symbol": "PEPE", "market_cap_rank": 30,
             "price": 0.1, "price_change_24h": 5, "sparkline": "url"}
        ]
        content, _ = await tools.run("get_trending", {})
        assert "sparkline" not in json.loads(content)[0]
