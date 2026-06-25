import pytest
from unittest.mock import AsyncMock

from app.services.contact_service import ContactService
from app.services.email.email_sender import EmailMessage
from app.schemas.contact import ContactRequest


RECIPIENT = "admin@example.com"


@pytest.fixture
def mock_sender():
    return AsyncMock()


@pytest.fixture
def service(mock_sender):
    return ContactService(email_sender=mock_sender, recipient=RECIPIENT)


@pytest.fixture
def contact_data():
    return ContactRequest(
        name="Jean Dupont",
        email="jean@exemple.com",
        phone="+33 6 00 00 00 00",
        message="Bonjour, je souhaite vous contacter.",
    )


class TestSendContactEmail:
    async def test_calls_sender_once(self, service, mock_sender, contact_data):
        await service.send_contact_email(contact_data)
        mock_sender.send.assert_called_once()

    async def test_sends_to_configured_recipient(self, service, mock_sender, contact_data):
        await service.send_contact_email(contact_data)
        message: EmailMessage = mock_sender.send.call_args[0][0]
        assert message.to == RECIPIENT

    async def test_subject_contains_sender_name(self, service, mock_sender, contact_data):
        await service.send_contact_email(contact_data)
        message: EmailMessage = mock_sender.send.call_args[0][0]
        assert "Jean Dupont" in message.subject

    async def test_html_body_contains_name(self, service, mock_sender, contact_data):
        await service.send_contact_email(contact_data)
        message: EmailMessage = mock_sender.send.call_args[0][0]
        assert "Jean Dupont" in message.html_body

    async def test_html_body_contains_email(self, service, mock_sender, contact_data):
        await service.send_contact_email(contact_data)
        message: EmailMessage = mock_sender.send.call_args[0][0]
        assert "jean@exemple.com" in message.html_body

    async def test_html_body_contains_phone(self, service, mock_sender, contact_data):
        await service.send_contact_email(contact_data)
        message: EmailMessage = mock_sender.send.call_args[0][0]
        assert "+33 6 00 00 00 00" in message.html_body

    async def test_html_body_contains_message(self, service, mock_sender, contact_data):
        await service.send_contact_email(contact_data)
        message: EmailMessage = mock_sender.send.call_args[0][0]
        assert "Bonjour, je souhaite vous contacter." in message.html_body

    async def test_shows_non_renseigne_when_no_phone(self, service, mock_sender):
        data = ContactRequest(
            name="Alice",
            email="alice@example.com",
            phone="",
            message="Hello",
        )
        await service.send_contact_email(data)
        message: EmailMessage = mock_sender.send.call_args[0][0]
        assert "Non renseigné" in message.html_body

    async def test_sends_emailmessage_instance(self, service, mock_sender, contact_data):
        await service.send_contact_email(contact_data)
        message = mock_sender.send.call_args[0][0]
        assert isinstance(message, EmailMessage)
