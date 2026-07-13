import pytest
from unittest.mock import AsyncMock

from app.services.symbols_service import SymbolesService


def make_market_coin(**overrides):
    base = {
        "id": "bitcoin",
        "symbol": "btc",
        "name": "Bitcoin",
        "image": "https://example.com/btc.png",
        "current_price": 50000.0,
        "market_cap": 1_000_000_000,
        "price_change_percentage_24h": 3.5,
    }
    base.update(overrides)
    return base


def make_search_coin(**overrides):
    base = {
        "id": "bitcoin",
        "symbol": "BTC",
        "name": "Bitcoin",
        "large": "https://example.com/large.png",
        "thumb": "https://example.com/thumb.png",
    }
    base.update(overrides)
    return base


@pytest.fixture
def mock_client():
    return AsyncMock()


@pytest.fixture
def service(mock_client):
    return SymbolesService(mock_client)


class TestGetListSymbol:
    async def test_formats_symbols_correctly(self, service, mock_client):
        mock_client.fetch_markets.return_value = [make_market_coin()]
        result = await service.get_list_symbol("eur", "market_cap_desc", 10, 1)

        assert len(result) == 1
        coin = result[0]
        assert coin["id"] == "bitcoin"
        assert coin["symbol"] == "btc"
        assert coin["name"] == "Bitcoin"
        assert coin["image"] == "https://example.com/btc.png"

    async def test_does_not_include_price_or_market_cap(self, service, mock_client):
        mock_client.fetch_markets.return_value = [make_market_coin()]
        result = await service.get_list_symbol("eur", "market_cap_desc", 10, 1)
        assert "price" not in result[0]
        assert "market_cap" not in result[0]

    async def test_returns_empty_list_when_no_data(self, service, mock_client):
        mock_client.fetch_markets.return_value = []
        result = await service.get_list_symbol("eur", "market_cap_desc", 10, 1)
        assert result == []

    async def test_passes_params_to_client(self, service, mock_client):
        mock_client.fetch_markets.return_value = []
        await service.get_list_symbol("usd", "volume_desc", 20, 2)
        mock_client.fetch_markets.assert_called_once_with("usd", "volume_desc", 20, 2)

    async def test_handles_multiple_coins(self, service, mock_client):
        mock_client.fetch_markets.return_value = [
            make_market_coin(id="bitcoin", symbol="btc"),
            make_market_coin(id="ethereum", symbol="eth", name="Ethereum"),
        ]
        result = await service.get_list_symbol("eur", "market_cap_desc", 10, 1)
        assert len(result) == 2
        assert result[1]["id"] == "ethereum"


class TestSearchSymbols:
    async def test_returns_formatted_results(self, service, mock_client):
        mock_client.fetch_search.return_value = [make_search_coin()]
        result = await service.search_symbols("bitcoin")

        assert len(result) == 1
        assert result[0]["id"] == "bitcoin"
        assert result[0]["symbol"] == "BTC"
        assert result[0]["name"] == "Bitcoin"
        assert result[0]["image"] == "https://example.com/large.png"

    async def test_uses_large_image_first(self, service, mock_client):
        coin = make_search_coin(large="https://large.png", thumb="https://thumb.png")
        mock_client.fetch_search.return_value = [coin]
        result = await service.search_symbols("bitcoin")
        assert result[0]["image"] == "https://large.png"

    async def test_falls_back_to_thumb_when_no_large(self, service, mock_client):
        coin = make_search_coin(large=None, thumb="https://thumb.png")
        mock_client.fetch_search.return_value = [coin]
        result = await service.search_symbols("bitcoin")
        assert result[0]["image"] == "https://thumb.png"

    async def test_returns_empty_string_when_no_image(self, service, mock_client):
        coin = make_search_coin(large=None, thumb=None)
        mock_client.fetch_search.return_value = [coin]
        result = await service.search_symbols("bitcoin")
        assert result[0]["image"] == ""

    async def test_respects_per_page_limit(self, service, mock_client):
        mock_client.fetch_search.return_value = [
            make_search_coin(id=str(i)) for i in range(20)
        ]
        result = await service.search_symbols("btc", per_page=5)
        assert len(result) == 5

    async def test_default_per_page_is_10(self, service, mock_client):
        mock_client.fetch_search.return_value = [
            make_search_coin(id=str(i)) for i in range(20)
        ]
        result = await service.search_symbols("btc")
        assert len(result) == 10

    async def test_passes_query_to_client(self, service, mock_client):
        mock_client.fetch_search.return_value = []
        await service.search_symbols("ethereum")
        mock_client.fetch_search.assert_called_once_with("ethereum")

    async def test_returns_empty_list_when_no_results(self, service, mock_client):
        mock_client.fetch_search.return_value = []
        result = await service.search_symbols("unknown")
        assert result == []
