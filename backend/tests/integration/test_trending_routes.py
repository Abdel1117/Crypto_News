import pytest
from unittest.mock import AsyncMock

from app.main import app
from app.controllers.trending_controller import get_trending_service


def make_trending_coin(**overrides):
    base = {
        "id": "bitcoin",
        "name": "Bitcoin",
        "symbol": "BTC",
        "market_cap_rank": 1,
        "image": "https://example.com/small.png",
        "price_btc": 1.0,
        "score": 0,
        "price": 50000.0,
        "price_change_24h": 2.5,
        "market_cap": "$ 1T",
        "total_volume": "$ 50B",
        "sparkline": "https://example.com/sparkline.svg",
    }
    base.update(overrides)
    return base


@pytest.fixture
def mock_trending_service():
    svc = AsyncMock()
    svc.get_trending_coins.return_value = [make_trending_coin()]
    return svc


@pytest.fixture(autouse=True)
def set_service_override(mock_trending_service):
    app.dependency_overrides[get_trending_service] = lambda: mock_trending_service


class TestGetTrendingRoute:
    async def test_returns_200(self, client):
        response = await client.get("/trending")
        assert response.status_code == 200

    async def test_returns_list_of_coins(self, client):
        body = (await client.get("/trending")).json()
        assert isinstance(body, list)
        assert len(body) == 1

    async def test_coin_has_expected_fields(self, client):
        coin = (await client.get("/trending")).json()[0]
        assert coin["id"] == "bitcoin"
        assert coin["name"] == "Bitcoin"
        assert coin["symbol"] == "BTC"
        assert coin["price"] == 50000.0

    async def test_returns_empty_list_when_no_trending(self, client, mock_trending_service):
        mock_trending_service.get_trending_coins.return_value = []
        body = (await client.get("/trending")).json()
        assert body == []

    async def test_calls_service_once(self, client, mock_trending_service):
        await client.get("/trending")
        mock_trending_service.get_trending_coins.assert_called_once()
