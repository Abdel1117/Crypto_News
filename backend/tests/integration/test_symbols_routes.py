import pytest
from unittest.mock import AsyncMock

from app.main import app
from app.controllers.symbols_controller import get_symbols_services


def make_symbol(**overrides):
    base = {
        "id": "bitcoin",
        "symbol": "btc",
        "name": "Bitcoin",
        "image": "https://example.com/btc.png",
    }
    base.update(overrides)
    return base


@pytest.fixture
def mock_symbols_service():
    svc = AsyncMock()
    svc.get_list_symbol.return_value = [make_symbol()]
    svc.search_symbols.return_value = [make_symbol()]
    return svc


@pytest.fixture(autouse=True)
def set_service_override(mock_symbols_service):
    app.dependency_overrides[get_symbols_services] = lambda: mock_symbols_service


class TestGetSymbolsRoute:
    async def test_returns_200(self, client):
        response = await client.get("/symbols")
        assert response.status_code == 200

    async def test_returns_list_of_symbols(self, client):
        body = (await client.get("/symbols")).json()
        assert isinstance(body, list)
        assert body[0]["id"] == "bitcoin"

    async def test_symbol_fields_are_present(self, client):
        coin = (await client.get("/symbols")).json()[0]
        for field in ("id", "symbol", "name", "image"):
            assert field in coin

    async def test_passes_query_params_to_service(self, client, mock_symbols_service):
        await client.get("/symbols?currency=usd&per_page=20&page=2")
        mock_symbols_service.get_list_symbol.assert_called_once_with(
            "usd", "market_cap_desc", 20, 2
        )

    async def test_uses_default_params(self, client, mock_symbols_service):
        await client.get("/symbols")
        mock_symbols_service.get_list_symbol.assert_called_once_with(
            "eur", "market_cap_desc", 10, 1
        )


class TestSearchSymbolsRoute:
    async def test_returns_200(self, client):
        response = await client.get("/symbols/search?query=bitcoin")
        assert response.status_code == 200

    async def test_returns_list_of_results(self, client):
        body = (await client.get("/symbols/search?query=bitcoin")).json()
        assert isinstance(body, list)
        assert len(body) == 1

    async def test_passes_query_to_service(self, client, mock_symbols_service):
        await client.get("/symbols/search?query=eth&per_page=5")
        mock_symbols_service.search_symbols.assert_called_once_with("eth", 5)

    async def test_returns_422_when_query_missing(self, client):
        response = await client.get("/symbols/search")
        assert response.status_code == 422
