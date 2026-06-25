import pytest
from unittest.mock import AsyncMock

from app.services.trending_service import TrendingService


def make_trending_item(**overrides):
    base = {
        "id": "bitcoin",
        "name": "Bitcoin",
        "symbol": "BTC",
        "market_cap_rank": 1,
        "small": "https://example.com/small.png",
        "price_btc": 1.0,
        "score": 0,
        "data": {
            "price": 50000.0,
            "price_change_percentage_24h": {"usd": 2.5},
            "market_cap": "$ 1T",
            "total_volume": "$ 50B",
            "sparkline": "https://example.com/sparkline.svg",
        },
    }
    base.update(overrides)
    return base


def make_trending_response(items):
    return {"coins": [{"item": item} for item in items]}


@pytest.fixture
def mock_client():
    return AsyncMock()


@pytest.fixture
def service(mock_client):
    return TrendingService(mock_client)


class TestGetTrendingCoins:
    async def test_formats_coin_correctly(self, service, mock_client):
        mock_client.fetch_trending.return_value = make_trending_response(
            [make_trending_item()]
        )
        result = await service.get_trending_coins()

        assert len(result) == 1
        coin = result[0]
        assert coin["id"] == "bitcoin"
        assert coin["name"] == "Bitcoin"
        assert coin["symbol"] == "BTC"
        assert coin["market_cap_rank"] == 1
        assert coin["image"] == "https://example.com/small.png"
        assert coin["price_btc"] == 1.0
        assert coin["score"] == 0

    async def test_extracts_nested_data_fields(self, service, mock_client):
        mock_client.fetch_trending.return_value = make_trending_response(
            [make_trending_item()]
        )
        result = await service.get_trending_coins()
        coin = result[0]
        assert coin["price"] == 50000.0
        assert coin["price_change_24h"] == 2.5
        assert coin["market_cap"] == "$ 1T"
        assert coin["total_volume"] == "$ 50B"
        assert coin["sparkline"] == "https://example.com/sparkline.svg"

    async def test_returns_empty_list_when_no_coins(self, service, mock_client):
        mock_client.fetch_trending.return_value = {"coins": []}
        result = await service.get_trending_coins()
        assert result == []

    async def test_skips_coins_without_item_key(self, service, mock_client):
        mock_client.fetch_trending.return_value = {"coins": [{"not_item": {}}]}
        result = await service.get_trending_coins()
        assert result == []

    async def test_handles_missing_optional_top_level_fields(self, service, mock_client):
        item = {
            "id": "bitcoin",
            "name": "Bitcoin",
            "symbol": "BTC",
            "data": {},
        }
        mock_client.fetch_trending.return_value = make_trending_response([item])
        result = await service.get_trending_coins()

        assert len(result) == 1
        coin = result[0]
        assert coin["market_cap_rank"] is None
        assert coin["price_btc"] is None
        assert coin["score"] is None
        assert coin["image"] is None

    async def test_handles_missing_data_subfields(self, service, mock_client):
        item = make_trending_item()
        item["data"] = {}
        mock_client.fetch_trending.return_value = make_trending_response([item])
        result = await service.get_trending_coins()

        coin = result[0]
        assert coin["price"] is None
        assert coin["price_change_24h"] is None
        assert coin["market_cap"] is None
        assert coin["total_volume"] is None
        assert coin["sparkline"] is None

    async def test_handles_missing_price_change_usd(self, service, mock_client):
        item = make_trending_item()
        item["data"]["price_change_percentage_24h"] = {}
        mock_client.fetch_trending.return_value = make_trending_response([item])
        result = await service.get_trending_coins()
        assert result[0]["price_change_24h"] is None

    async def test_returns_multiple_coins(self, service, mock_client):
        items = [make_trending_item(id=f"coin-{i}", name=f"Coin {i}") for i in range(5)]
        mock_client.fetch_trending.return_value = make_trending_response(items)
        result = await service.get_trending_coins()
        assert len(result) == 5
