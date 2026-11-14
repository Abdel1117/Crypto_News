import email
from email.header import decode_header, make_header
from unittest.mock import AsyncMock, patch

import pytest
from aiosmtplib.email import flatten_message

from app.core.config import settings
from app.services.email.email_sender import EmailMessage
from app.services.email.smtp_email_sender import SmtpEmailSender, build_email_sender

LONG_LINK = "https://crypto-explorer.fr/desabonnement?token=" + "a.b-c_d" * 40


async def send(message: EmailMessage, sender_address: str = ""):
    """What aiosmtplib is given, parsed back the way a mail client would read it."""
    sender = SmtpEmailSender("smtp.test", 587, "login@example.com", "secret", sender=sender_address)
    with patch("app.services.email.smtp_email_sender.aiosmtplib.send", new_callable=AsyncMock) as smtp:
        await sender.send(message)
    mime = smtp.call_args.args[0]
    return email.message_from_bytes(flatten_message(mime)), smtp.call_args.kwargs


def make_message(**overrides):
    values = dict(to="user@example.com", subject="Sujet", html_body="<p>HTML</p>")
    values.update(overrides)
    return EmailMessage(**values)


class TestSend:
    async def test_connects_with_the_configured_server(self):
        _, options = await send(make_message())
        assert options["hostname"] == "smtp.test"
        assert options["port"] == 587
        assert options["username"] == "login@example.com"
        assert options["start_tls"] is True

    async def test_sends_from_the_login_by_default(self):
        parsed, _ = await send(make_message())
        assert parsed["From"] == "login@example.com"

    async def test_can_send_from_another_address(self):
        parsed, _ = await send(make_message(), sender_address="Crypto-Explorer <alertes@example.com>")
        assert parsed["From"] == "Crypto-Explorer <alertes@example.com>"

    async def test_accented_subject_reaches_the_reader_intact(self):
        subject = "BTC est passé sous 50 000,00 €"
        parsed, _ = await send(make_message(subject=subject))
        assert str(make_header(decode_header(parsed["Subject"]))) == subject

    async def test_html_only_stays_one_part(self):
        parsed, _ = await send(make_message())
        assert [p.get_content_type() for p in parsed.get_payload()] == ["text/html"]

    async def test_text_part_comes_first_so_clients_prefer_html(self):
        parsed, _ = await send(make_message(text_body="Texte é"))
        parts = parsed.get_payload()
        assert [p.get_content_type() for p in parts] == ["text/plain", "text/html"]
        assert parts[0].get_payload(decode=True).decode("utf-8") == "Texte é"

    async def test_long_unsubscribe_link_survives_header_folding(self):
        parsed, _ = await send(make_message(headers={"List-Unsubscribe": f"<{LONG_LINK}>"}))
        unfolded = "".join(parsed["List-Unsubscribe"].split())
        assert unfolded == f"<{LONG_LINK}>"


class TestBuildEmailSender:
    @pytest.mark.parametrize("host,user", [("", ""), ("smtp.test", ""), ("", "login@example.com")])
    def test_none_without_a_complete_configuration(self, monkeypatch, host, user):
        monkeypatch.setattr(settings, "SMTP_HOST", host)
        monkeypatch.setattr(settings, "SMTP_USER", user)
        assert build_email_sender() is None

    def test_builds_from_the_settings(self, monkeypatch):
        monkeypatch.setattr(settings, "SMTP_HOST", "smtp.test")
        monkeypatch.setattr(settings, "SMTP_USER", "login@example.com")
        assert isinstance(build_email_sender(), SmtpEmailSender)
