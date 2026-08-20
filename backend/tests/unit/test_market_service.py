import pytest
from unittest.mock import AsyncMock

from app.services.market_service import MarketService


def make_coin(**overrides):
    base = {
        "id": "bitcoin",
        "symbol": "btc",
        "name": "Bitcoin",
        "image": "https://example.com/btc.png",
        "current_price": 50000.0,
        "market_cap": 1_000_000_000,
        "price_change_percentage_24h": 3.5,
        "total_volume": 500_000_000,
        "sparkline_in_7d": {"price": [1.0, 2.0, 3.0]},
    }
    base.update(overrides)
    return base


@pytest.fixture
def mock_client():
    return AsyncMock()


@pytest.fixture
def service(mock_client):
    return MarketService(mock_client)


class TestGetTopMarkets:
    async def test_formats_coins_correctly(self, service, mock_client):
        mock_client.fetch_markets.return_value = [make_coin()]
        result = await service.get_top_markets("eur", "market_cap_desc", 10, 1)

        assert len(result) == 1
        coin = result[0]
        assert coin["id"] == "bitcoin"
        assert coin["name"] == "Bitcoin"
        assert coin["image"] == "https://example.com/btc.png"
        assert coin["price"] == 50000.0
        assert coin["market_cap"] == 1_000_000_000
        assert coin["change_24h"] == 3.5
        assert coin["volume_24h"] == 500_000_000

    async def test_uppercases_symbol(self, service, mock_client):
        mock_client.fetch_markets.return_value = [make_coin(symbol="eth")]
        result = await service.get_top_markets("eur", "market_cap_desc", 10, 1)
        assert result[0]["symbol"] == "ETH"

    async def test_returns_empty_list_when_no_data(self, service, mock_client):
        mock_client.fetch_markets.return_value = []
        result = await service.get_top_markets("eur", "market_cap_desc", 10, 1)
        assert result == []

    async def test_passes_params_to_client(self, service, mock_client):
        mock_client.fetch_markets.return_value = []
        await service.get_top_markets("usd", "volume_desc", 20, 2)
        mock_client.fetch_markets.assert_called_once_with("usd", "volume_desc", 20, 2)


class TestGetMarketById:
    async def test_returns_formatted_coin(self, service, mock_client):
        mock_client.fetch_markets.return_value = [make_coin()]
        result = await service.get_market_by_id("eur", "bitcoin")
        assert result is not None
        assert result["id"] == "bitcoin"
        assert result["symbol"] == "BTC"

    async def test_returns_none_when_not_found(self, service, mock_client):
        mock_client.fetch_markets.return_value = []
        result = await service.get_market_by_id("eur", "unknown-coin")
        assert result is None

    async def test_passes_coin_id_to_client(self, service, mock_client):
        mock_client.fetch_markets.return_value = []
        await service.get_market_by_id("eur", "ethereum")
        mock_client.fetch_markets.assert_called_once_with(
            "eur", "market_cap_desc", 1, 1, False, ids="ethereum"
        )


class TestGetMarketView:
    async def test_formats_market_view_correctly(self, service, mock_client):
        mock_client.fetch_markets_view.return_value = {
            "data": {
                "total_market_cap": {"eur": 2_500_000_000_000},
                "total_volume": {"eur": 100_000_000_000},
                "market_cap_percentage": {"btc": 52.5},
                "market_cap_change_percentage_24h_usd": 1.2,
                "volume_change_percentage_24h_usd": -0.5,
            }
        }
        result = await service.get_market_view("eur")
        assert result["total_market_cap"] == 2_500_000_000_000
        assert result["total_volume"] == 100_000_000_000
        assert result["market_cap_percentage"] == 52.5
        assert result["market_cap_change_percentage_24h"] == 1.2
        assert result["volume_change_percentage_24h"] == -0.5

    async def test_returns_none_for_missing_currency_key(self, service, mock_client):
        mock_client.fetch_markets_view.return_value = {
            "data": {
                "total_market_cap": {},
                "total_volume": {},
                "market_cap_percentage": {},
            }
        }
        result = await service.get_market_view("usd")
        assert result["total_market_cap"] is None
        assert result["total_volume"] is None
        assert result["market_cap_percentage"] is None

    async def test_reads_btc_dominance_regardless_of_currency(self, service, mock_client):
        mock_client.fetch_markets_view.return_value = {
            "data": {
                "total_market_cap": {"eur": 1},
                "total_volume": {"eur": 1},
                "market_cap_percentage": {"btc": 60.0, "eth": 18.0},
            }
        }
        result = await service.get_market_view("eur")
        assert result["market_cap_percentage"] == 60.0


class TestGetOhlc:
    async def test_returns_client_data_directly(self, service, mock_client):
        ohlc_data = [[1234567890, 50000, 51000, 49000, 50500]]
        mock_client.fetch_ohlc.return_value = ohlc_data
        result = await service.get_ohlc("eur", "1", "bitcoin")
        assert result == ohlc_data

    async def test_passes_all_params_to_client(self, service, mock_client):
        mock_client.fetch_ohlc.return_value = []
        await service.get_ohlc("usd", "7", "ethereum")
        mock_client.fetch_ohlc.assert_called_once_with("usd", "7", "ethereum")


class TestGetTopGainersLosers:
    async def test_top_gainers_sorted_by_highest_change_first(self, service, mock_client):
        coins = [
            make_coin(id="a", symbol="A", price_change_percentage_24h=-5.0),
            make_coin(id="b", symbol="B", price_change_percentage_24h=10.0),
            make_coin(id="c", symbol="C", price_change_percentage_24h=3.0),
        ]
        mock_client.fetch_markets.return_value = coins
        result = await service.get_top_gainers_losers("eur", "1d", "1d", "300")
        gainers = result["top_gainers"]
        assert gainers[0]["id"] == "b"
        assert gainers[1]["id"] == "c"
        assert gainers[2]["id"] == "a"

    async def test_top_losers_sorted_by_lowest_change_first(self, service, mock_client):
        coins = [
            make_coin(id="a", symbol="A", price_change_percentage_24h=-5.0),
            make_coin(id="b", symbol="B", price_change_percentage_24h=10.0),
            make_coin(id="c", symbol="C", price_change_percentage_24h=3.0),
        ]
        mock_client.fetch_markets.return_value = coins
        result = await service.get_top_gainers_losers("eur", "1d", "1d", "300")
        losers = result["top_losers"]
        assert losers[0]["id"] == "a"

    async def test_filters_coins_with_none_price_change(self, service, mock_client):
        coins = [
            make_coin(id="a", symbol="A", price_change_percentage_24h=None),
            make_coin(id="b", symbol="B", price_change_percentage_24h=5.0),
        ]
        mock_client.fetch_markets.return_value = coins
        result = await service.get_top_gainers_losers("eur", "1d", "1d", "300")
        ids_in_gainers = [c["id"] for c in result["top_gainers"]]
        assert "a" not in ids_in_gainers

    async def test_limits_to_10_gainers_and_losers(self, service, mock_client):
        coins = [
            make_coin(id=str(i), symbol=str(i), price_change_percentage_24h=float(i))
            for i in range(20)
        ]
        mock_client.fetch_markets.return_value = coins
        result = await service.get_top_gainers_losers("eur", "1d", "1d", "300")
        assert len(result["top_gainers"]) == 10
        assert len(result["top_losers"]) == 10

    async def test_maps_coin_fields_including_sparkline(self, service, mock_client):
        coin = make_coin(
            id="bitcoin",
            symbol="btc",
            name="Bitcoin",
            current_price=50000.0,
            sparkline_in_7d={"price": [1.0, 2.0]},
            price_change_percentage_24h=3.5,
        )
        mock_client.fetch_markets.return_value = [coin]
        result = await service.get_top_gainers_losers("eur", "1d", "1d", "300")
        gainer = result["top_gainers"][0]
        assert gainer["symbol"] == "BTC"
        assert gainer["sparkline"] == [1.0, 2.0]
        assert gainer["price"] == 50000.0
        assert gainer["price_change_percentage"] == 3.5

    async def test_returns_empty_sparkline_when_missing(self, service, mock_client):
        coin = make_coin(price_change_percentage_24h=1.0)
        coin.pop("sparkline_in_7d")
        mock_client.fetch_markets.return_value = [coin]
        result = await service.get_top_gainers_losers("eur", "1d", "1d", "300")
        assert result["top_gainers"][0]["sparkline"] == []
