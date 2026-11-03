from unittest.mock import AsyncMock

import pytest
from pydantic import ValidationError

from app.schemas.contact import ContactRequest
from app.services.contact_service import ContactService


async def send(**fields):
    sender = AsyncMock()
    data = ContactRequest(
        name=fields.get("name", "Jean"),
        email=fields.get("email", "jean@exemple.com"),
        phone=fields.get("phone", ""),
        message=fields.get("message", "Bonjour"),
    )
    await ContactService(sender, recipient="admin@example.com").send_contact_email(data)
    return sender.send.call_args.args[0]


class TestEscaping:
    async def test_markup_in_fields_is_escaped(self):
        message = await send(
            name="<b>Jean</b>",
            phone="<img src=x>",
            message='<a href="https://evil.example">Cliquez ici</a>',
        )
        body = message.html_body
        assert "<b>Jean</b>" not in body
        assert "&lt;b&gt;Jean&lt;/b&gt;" in body
        assert "<img src=x>" not in body
        assert '<a href="https://evil.example">' not in body
        assert "&lt;a href=&quot;https://evil.example&quot;&gt;" in body

    async def test_message_line_breaks_are_kept(self):
        message = await send(message="Ligne 1\nLigne 2")
        assert "Ligne 1<br />Ligne 2" in message.html_body

    async def test_subject_stays_on_one_line(self):
        message = await send(name="Jean\r\nBcc: victim@example.com")
        assert "\r" not in message.subject
        assert "\n" not in message.subject
        assert message.subject == "[Contact] Message de Jean Bcc: victim@example.com"


class TestLimits:
    @pytest.mark.parametrize(
        "field,value",
        [("name", "x" * 101), ("phone", "1" * 31), ("message", "x" * 5001)],
    )
    def test_rejects_oversized_fields(self, field, value):
        base = {"name": "Jean", "email": "jean@exemple.com", "phone": "", "message": "Bonjour"}
        with pytest.raises(ValidationError):
            ContactRequest(**{**base, field: value})
