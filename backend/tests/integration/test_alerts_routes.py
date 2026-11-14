from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.auth.email_tokens import PURPOSE_CONFIRM_EMAIL, PURPOSE_STOP_ALERTS, create_email_token
from app.controllers.alerts_controller import get_alert_service
from app.core.config import settings
from app.dependencies.auth import get_current_user
from app.main import app
from app.models.user import User
from app.schemas.alerts import AlertOut, AlertsOverview

CREATE = {"coin_id": "bitcoin", "currency": "eur", "direction": "below", "threshold": "50000"}
USER = User(id=7, full_name="Test", email="t@example.com")


def alert_out(**overrides) -> AlertOut:
    values = dict(
        id=1,
        coin_id="bitcoin",
        symbol="BTC",
        name="Bitcoin",
        image="",
        currency="eur",
        direction="below",
        threshold=50000.0,
        is_active=True,
        created_at=datetime(2026, 11, 6, tzinfo=timezone.utc),
        triggered_at=None,
        triggered_price=None,
    )
    values.update(overrides)
    return AlertOut(**values)


@pytest.fixture
def service():
    mock = AsyncMock()
    app.dependency_overrides[get_alert_service] = lambda: mock
    return mock


@pytest.fixture
def logged_in(service):
    app.dependency_overrides[get_current_user] = lambda: USER


class TestAuth:
    @pytest.mark.parametrize(
        "method,url",
        [
            ("get", "/alerts"),
            ("post", "/alerts"),
            ("patch", "/alerts/1"),
            ("delete", "/alerts/1"),
        ],
    )
    async def test_requires_login(self, client, method, url):
        response = await getattr(client, method)(url)
        assert response.status_code == 401

    @pytest.mark.parametrize("purpose", [PURPOSE_CONFIRM_EMAIL, PURPOSE_STOP_ALERTS])
    async def test_a_link_from_an_email_is_not_a_login(self, client, purpose):
        token = create_email_token(7, purpose)
        response = await client.get("/alerts", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401


class TestList:
    async def test_returns_the_overview(self, client, logged_in, service):
        service.overview.return_value = AlertsOverview(
            items=[alert_out()],
            email="t@example.com",
            email_verified=True,
            alerts_available=True,
            max_alerts=20,
            check_interval_seconds=600,
        )
        response = await client.get("/alerts")
        assert response.status_code == 200
        body = response.json()
        assert body["items"][0]["symbol"] == "BTC"
        assert body["email_verified"] is True
        assert body["check_interval_seconds"] == 600
        service.overview.assert_awaited_once_with(USER)


class TestCreate:
    async def test_creates_for_the_logged_in_user(self, client, logged_in, service):
        service.create.return_value = alert_out()
        response = await client.post("/alerts", json=CREATE)
        assert response.status_code == 201
        assert response.json()["id"] == 1
        assert service.create.await_args.args[0] is USER

    @pytest.mark.parametrize(
        "threshold", ["85000", "85000.5", "0.000000000001", "999999999999999999"]
    )
    async def test_accepts_prices_the_column_can_hold(self, client, logged_in, service, threshold):
        service.create.return_value = alert_out()
        response = await client.post("/alerts", json={**CREATE, "threshold": threshold})
        assert response.status_code == 201

    @pytest.mark.parametrize(
        "body",
        [
            {**CREATE, "threshold": "0"},
            {**CREATE, "threshold": "-1"},
            {**CREATE, "threshold": "0.0000000000001"},  # 13 decimals
            {**CREATE, "threshold": "1000000000000000000"},  # would overflow Numeric(30, 12)
            {**CREATE, "threshold": "NaN"},
            {**CREATE, "threshold": "Infinity"},
            {**CREATE, "threshold": "abc"},
            {**CREATE, "currency": "gbp"},
            {**CREATE, "direction": "sideways"},
            {**CREATE, "coin_id": "../../secret"},
            {**CREATE, "coin_id": ""},
            {k: v for k, v in CREATE.items() if k != "threshold"},
        ],
    )
    async def test_rejects_invalid_requests(self, client, logged_in, service, body):
        response = await client.post("/alerts", json=body)
        assert response.status_code == 422
        service.create.assert_not_awaited()

    async def test_passes_on_the_services_refusals(self, client, logged_in, service):
        service.create.side_effect = HTTPException(403, "Confirme ton adresse e-mail.")
        response = await client.post("/alerts", json=CREATE)
        assert response.status_code == 403
        assert response.json()["detail"] == "Confirme ton adresse e-mail."


class TestUpdateAndDelete:
    async def test_updates_the_state(self, client, logged_in, service):
        service.set_active.return_value = alert_out(is_active=False)
        response = await client.patch("/alerts/5", json={"is_active": False})
        assert response.status_code == 200
        assert response.json()["is_active"] is False
        service.set_active.assert_awaited_once_with(USER, 5, False)

    async def test_update_needs_a_boolean(self, client, logged_in, service):
        response = await client.patch("/alerts/5", json={"is_active": "maybe"})
        assert response.status_code == 422

    async def test_deletes(self, client, logged_in, service):
        response = await client.delete("/alerts/5")
        assert response.status_code == 204
        service.delete.assert_awaited_once_with(USER, 5)

    async def test_ids_must_be_numbers(self, client, logged_in, service):
        response = await client.delete("/alerts/abc")
        assert response.status_code == 422


class TestUnsubscribe:
    async def test_works_without_a_login(self, client, service):
        service.unsubscribe.return_value = 3
        response = await client.post("/alerts/unsubscribe", json={"token": "abc"})
        assert response.status_code == 200
        assert response.json() == {"deactivated": 3}
        service.unsubscribe.assert_awaited_once_with("abc")

    @pytest.mark.parametrize("body", [{}, {"token": ""}, {"token": "x" * 2001}])
    async def test_rejects_a_missing_or_oversized_token(self, client, service, body):
        response = await client.post("/alerts/unsubscribe", json=body)
        assert response.status_code == 422


class TestServiceWiring:
    def test_alerts_are_unavailable_when_the_check_is_off(self, monkeypatch):
        monkeypatch.setattr(settings, "SMTP_HOST", "smtp.test")
        monkeypatch.setattr(settings, "SMTP_USER", "login@example.com")
        monkeypatch.setattr(settings, "PRICE_ALERT_INTERVAL", 0)
        assert get_alert_service(session=AsyncMock()).sender is None

        monkeypatch.setattr(settings, "PRICE_ALERT_INTERVAL", 600)
        assert get_alert_service(session=AsyncMock()).sender is not None
