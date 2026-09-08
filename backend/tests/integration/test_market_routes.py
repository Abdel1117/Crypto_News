import pytest
from unittest.mock import AsyncMock

from app.main import app
from app.controllers.market_controller import get_market_service


def make_market_coin(**overrides):
    base = {
        "id": "bitcoin",
        "symbol": "BTC",
        "name": "Bitcoin",
        "image": "https://example.com/btc.png",
        "price": 50000.0,
        "market_cap": 1_000_000_000,
        "change_24h": 3.5,
    }
    base.update(overrides)
    return base


def make_market_view():
    return {
        "total_market_cap": 2_500_000_000_000,
        "total_volume": 100_000_000_000,
        "market_cap_percentage": 52.5,
        "market_cap_change_percentage_24h": 1.2,
        "volume_change_percentage_24h": -0.5,
    }


def make_ohlc():
    return [[1234567890, 50000.0, 51000.0, 49000.0, 50500.0]]


def make_gainers_losers():
    return {
        "top_gainers": [make_market_coin(id="a", change_24h=10.0)],
        "top_losers": [make_market_coin(id="b", change_24h=-5.0)],
    }


@pytest.fixture
def mock_market_service():
    svc = AsyncMock()
    svc.get_top_markets.return_value = [make_market_coin()]
    svc.get_market_view.return_value = make_market_view()
    svc.get_ohlc.return_value = make_ohlc()
    svc.get_top_gainers_losers.return_value = make_gainers_losers()
    svc.get_market_by_id.return_value = make_market_coin()
    svc.get_exchange_rate.return_value = {"base": "eur", "quote": "usd", "rate": 1.08}
    return svc


@pytest.fixture(autouse=True)
def set_service_override(mock_market_service):
    app.dependency_overrides[get_market_service] = lambda: mock_market_service


class TestGetMarketsRoute:
    async def test_returns_200(self, client):
        response = await client.get("/markets")
        assert response.status_code == 200

    async def test_returns_list(self, client):
        body = (await client.get("/markets")).json()
        assert isinstance(body, list)
        assert len(body) == 1

    async def test_coin_has_expected_fields(self, client):
        coin = (await client.get("/markets")).json()[0]
        assert coin["id"] == "bitcoin"
        assert coin["symbol"] == "BTC"
        assert coin["price"] == 50000.0

    async def test_passes_query_params_to_service(self, client, mock_market_service):
        await client.get("/markets?currency=usd&per_page=20&page=2")
        mock_market_service.get_top_markets.assert_called_once_with(
            "usd", "market_cap_desc", 20, 2
        )

    async def test_uses_default_params(self, client, mock_market_service):
        await client.get("/markets")
        mock_market_service.get_top_markets.assert_called_once_with(
            "eur", "market_cap_desc", 20, 1
        )


class TestGetMarketViewRoute:
    async def test_returns_200(self, client):
        response = await client.get("/markets/markets_view")
        assert response.status_code == 200

    async def test_returns_market_view_fields(self, client):
        body = (await client.get("/markets/markets_view")).json()
        assert "total_market_cap" in body
        assert "total_volume" in body
        assert "market_cap_percentage" in body

    async def test_passes_currency_to_service(self, client, mock_market_service):
        await client.get("/markets/markets_view?currency=usd")
        mock_market_service.get_market_view.assert_called_once_with("usd")


class TestGetOhlcRoute:
    async def test_returns_200(self, client):
        response = await client.get("/markets/get_ohlc")
        assert response.status_code == 200

    async def test_returns_ohlc_data(self, client):
        body = (await client.get("/markets/get_ohlc")).json()
        assert isinstance(body, list)
        assert len(body) == 1

    async def test_converts_timeframe_and_passes_to_service(self, client, mock_market_service):
        await client.get("/markets/get_ohlc?selectedTimeFrame=1w&cryptoId=ethereum")
        mock_market_service.get_ohlc.assert_called_once_with("eur", 7, "ethereum")

    async def test_returns_500_for_unknown_timeframe(self, client):
        response = await client.get("/markets/get_ohlc?selectedTimeFrame=bad_value")
        assert response.status_code == 500


class TestGetTopWinnersLosersRoute:
    # top_coins must be passed explicitly: the route has a bug (default int 300 on a str param)
    # which causes Pydantic v2 to return 422 when top_coins is omitted.
    BASE_URL = "/markets/get_top_winners_losers?top_coins=300"

    async def test_returns_200(self, client):
        response = await client.get(self.BASE_URL)
        assert response.status_code == 200

    async def test_response_has_gainers_and_losers_keys(self, client):
        body = (await client.get(self.BASE_URL)).json()
        assert "top_gainers" in body
        assert "top_losers" in body

    async def test_passes_params_to_service(self, client, mock_market_service):
        await client.get(
            "/markets/get_top_winners_losers?currency=usd&duration=7d&top_coins=100"
        )
        call_args = mock_market_service.get_top_gainers_losers.call_args
        assert call_args[0][0] == "usd"
        assert call_args[0][3] == "100"


class TestGetExchangeRateRoute:
    async def test_returns_200(self, client):
        response = await client.get("/markets/exchange-rate")
        assert response.status_code == 200

    async def test_returns_rate_data(self, client):
        body = (await client.get("/markets/exchange-rate")).json()
        assert body == {"base": "eur", "quote": "usd", "rate": 1.08}

    async def test_returns_empty_dict_when_unavailable(self, client, mock_market_service):
        mock_market_service.get_exchange_rate.return_value = None
        body = (await client.get("/markets/exchange-rate")).json()
        assert body == {}

    async def test_passes_base_and_quote_to_service(self, client, mock_market_service):
        await client.get("/markets/exchange-rate?base=usd&quote=eur")
        mock_market_service.get_exchange_rate.assert_called_once_with("usd", "eur")

    async def test_uses_default_params(self, client, mock_market_service):
        await client.get("/markets/exchange-rate")
        mock_market_service.get_exchange_rate.assert_called_once_with("eur", "usd")


class TestGetMarketCoinRoute:
    async def test_returns_200_when_found(self, client):
        response = await client.get("/markets/coin?cryptoId=bitcoin")
        assert response.status_code == 200

    async def test_returns_coin_data(self, client):
        body = (await client.get("/markets/coin?cryptoId=bitcoin")).json()
        assert body["id"] == "bitcoin"

    async def test_returns_empty_dict_when_not_found(self, client, mock_market_service):
        mock_market_service.get_market_by_id.return_value = None
        body = (await client.get("/markets/coin?cryptoId=unknown")).json()
        assert body == {}

    async def test_passes_currency_and_id_to_service(self, client, mock_market_service):
        await client.get("/markets/coin?currency=usd&cryptoId=ethereum")
        mock_market_service.get_market_by_id.assert_called_once_with("usd", "ethereum")
