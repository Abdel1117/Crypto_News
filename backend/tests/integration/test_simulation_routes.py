from unittest.mock import AsyncMock

import pytest

from app.controllers.simulation_controller import get_simulation_service
from app.dependencies.auth import get_current_user
from app.main import app
from app.models.user import User
from app.services.simulation.simulation_service import SimulationError

CREATE = {"initial_capital": 10000, "currency": "eur", "country": "FR"}


@pytest.fixture
def service():
    return AsyncMock()


@pytest.fixture
def logged_in(service):
    app.dependency_overrides[get_current_user] = lambda: User(
        id=7, full_name="Test", email="t@example.com"
    )
    app.dependency_overrides[get_simulation_service] = lambda: service


class TestCountries:
    async def test_is_public_and_lists_eight_countries(self, client):
        response = await client.get("/simulation/countries")
        assert response.status_code == 200
        body = response.json()
        assert {c["code"] for c in body} == {"FR", "BE", "CH", "DE", "ES", "IT", "GB", "US"}
        france = next(c for c in body if c["code"] == "FR")
        assert france["default_currency"] == "eur"
        assert france["sources"][0]["url"].startswith("https://")
        assert france["verified_on"]


class TestAuth:
    @pytest.mark.parametrize(
        "method,url",
        [
            ("get", "/simulation/portfolio"),
            ("post", "/simulation/portfolio"),
            ("patch", "/simulation/portfolio"),
            ("post", "/simulation/portfolio/reset"),
            ("post", "/simulation/trades"),
            ("get", "/simulation/trades"),
        ],
    )
    async def test_requires_login(self, client, method, url):
        response = await getattr(client, method)(url)
        assert response.status_code == 401


class TestValidation:
    @pytest.mark.parametrize(
        "body",
        [
            {**CREATE, "initial_capital": 999},
            {**CREATE, "initial_capital": 50001},
            {**CREATE, "currency": "gbp"},
            {**CREATE, "country": "PT"},
            {**CREATE, "initial_capital": "10000.123"},
        ],
    )
    async def test_rejects_invalid_portfolio_settings(self, client, logged_in, service, body):
        response = await client.post("/simulation/portfolio", json=body)
        assert response.status_code == 422
        service.create.assert_not_called()

    async def test_accepts_the_bounds(self, client, logged_in, service):
        service.create.return_value = None
        for capital in (1000, 50000):
            response = await client.post("/simulation/portfolio", json={**CREATE, "initial_capital": capital})
            assert response.status_code != 422

    @pytest.mark.parametrize(
        "body",
        [
            {"coin_id": "bitcoin", "side": "buy"},  # neither quantity nor amount
            {"coin_id": "bitcoin", "side": "buy", "quantity": 1, "amount": 100},  # both
            {"coin_id": "bitcoin", "side": "sell", "amount": 100},  # sells use a quantity
            {"coin_id": "bitcoin", "side": "buy", "quantity": -1},
            {"coin_id": "../global", "side": "buy", "quantity": 1},
            {"coin_id": "bitcoin", "side": "short", "quantity": 1},
        ],
    )
    async def test_rejects_invalid_orders(self, client, logged_in, service, body):
        response = await client.post("/simulation/trades", json=body)
        assert response.status_code == 422
        service.place_trade.assert_not_called()

    async def test_trade_list_limit_is_bounded(self, client, logged_in):
        response = await client.get("/simulation/trades?limit=1000")
        assert response.status_code == 422


class TestErrors:
    async def test_service_errors_keep_their_status_and_message(self, client, logged_in, service):
        service.view.side_effect = SimulationError(404, "Aucun portefeuille de simulation.")
        response = await client.get("/simulation/portfolio")
        assert response.status_code == 404
        assert response.json()["detail"] == "Aucun portefeuille de simulation."

    async def test_order_is_passed_to_the_service(self, client, logged_in, service):
        service.place_trade.side_effect = SimulationError(409, "Solde insuffisant pour cet achat.")
        response = await client.post(
            "/simulation/trades", json={"coin_id": "bitcoin", "side": "buy", "amount": 500}
        )
        assert response.status_code == 409
        user_id, order = service.place_trade.call_args.args
        assert user_id == 7
        assert order.coin_id == "bitcoin"
        assert str(order.amount) == "500"
