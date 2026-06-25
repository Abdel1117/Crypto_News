import pytest
from unittest.mock import AsyncMock

from app.main import app
from app.controllers.contact_controller import get_contact_service


VALID_PAYLOAD = {
    "name": "Jean Dupont",
    "email": "jean@exemple.com",
    "phone": "+33 6 00 00 00 00",
    "message": "Bonjour, je souhaite vous contacter.",
}


@pytest.fixture
def mock_contact_service():
    svc = AsyncMock()
    svc.send_contact_email.return_value = None
    return svc


@pytest.fixture(autouse=True)
def set_service_override(mock_contact_service):
    app.dependency_overrides[get_contact_service] = lambda: mock_contact_service


class TestSendContactRoute:
    async def test_returns_200_on_success(self, client):
        response = await client.post("/contact/send", json=VALID_PAYLOAD)
        assert response.status_code == 200

    async def test_response_contains_success_message(self, client):
        body = (await client.post("/contact/send", json=VALID_PAYLOAD)).json()
        assert "message" in body
        assert "succès" in body["message"]

    async def test_calls_service_with_contact_data(self, client, mock_contact_service):
        await client.post("/contact/send", json=VALID_PAYLOAD)
        mock_contact_service.send_contact_email.assert_called_once()

    async def test_returns_500_when_service_raises(self, client, mock_contact_service):
        mock_contact_service.send_contact_email.side_effect = Exception("SMTP failure")
        response = await client.post("/contact/send", json=VALID_PAYLOAD)
        assert response.status_code == 500

    async def test_500_response_has_error_detail(self, client, mock_contact_service):
        mock_contact_service.send_contact_email.side_effect = Exception("SMTP failure")
        body = (await client.post("/contact/send", json=VALID_PAYLOAD)).json()
        assert "Erreur" in body["detail"]

    async def test_returns_422_when_email_invalid(self, client):
        payload = {**VALID_PAYLOAD, "email": "not-an-email"}
        response = await client.post("/contact/send", json=payload)
        assert response.status_code == 422

    async def test_returns_422_when_name_missing(self, client):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "name"}
        response = await client.post("/contact/send", json=payload)
        assert response.status_code == 422

    async def test_returns_422_when_message_missing(self, client):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "message"}
        response = await client.post("/contact/send", json=payload)
        assert response.status_code == 422

    async def test_accepts_payload_without_phone(self, client):
        payload = {**VALID_PAYLOAD, "phone": ""}
        response = await client.post("/contact/send", json=payload)
        assert response.status_code == 200
