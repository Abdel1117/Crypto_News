import re
from decimal import Decimal

import pytest

from app.auth.email_tokens import PURPOSE_CONFIRM_EMAIL, PURPOSE_STOP_ALERTS, read_email_token
from app.core.config import settings
from app.services.email.messages import NBSP, confirmation_email, format_price, price_alert_email


@pytest.fixture(autouse=True)
def public_url(monkeypatch):
    monkeypatch.setattr(settings, "APP_PUBLIC_URL", "https://site.test/")


def alert_email(**overrides):
    values = dict(
        symbol="BTC",
        name="Bitcoin",
        direction="below",
        threshold=Decimal("50000"),
        price=Decimal("49870.5"),
        currency="eur",
    )
    values.update(overrides)
    return price_alert_email("user@example.com", 7, **values)


def token_after(text: str, path: str) -> str:
    match = re.search(re.escape(path) + r"\?token=([\w.\-]+)", text)
    assert match, f"no {path} link in the text"
    return match.group(1)


class TestFormatPrice:
    @pytest.mark.parametrize(
        "value,currency,expected",
        [
            ("50000", "eur", f"50{NBSP}000,00{NBSP}€"),
            ("85000", "usd", f"85{NBSP}000,00{NBSP}$"),
            ("1234567.5", "eur", f"1{NBSP}234{NBSP}567,50{NBSP}€"),
            ("999", "eur", f"999,00{NBSP}€"),
            ("0.5", "eur", f"0,50{NBSP}€"),
            ("1.2345", "usd", f"1,2345{NBSP}$"),
            ("0.00001234", "eur", f"0,00001234{NBSP}€"),
            ("0.000000000001", "eur", f"0,000000000001{NBSP}€"),
        ],
    )
    def test_french_format(self, value, currency, expected):
        assert format_price(Decimal(value), currency) == expected

    def test_reads_the_exponent_notation_of_small_floats(self):
        assert format_price(Decimal(str(0.000012)), "eur") == f"0,000012{NBSP}€"


class TestPriceAlertEmail:
    def test_says_what_happened_going_down(self):
        message = alert_email()
        assert message.to == "user@example.com"
        assert message.subject == f"BTC est passé sous 50{NBSP}000,00{NBSP}€"
        assert f"49{NBSP}870,50{NBSP}€" in message.html_body
        assert f"49{NBSP}870,50{NBSP}€" in message.text_body

    def test_says_what_happened_going_up(self):
        message = alert_email(direction="above", threshold=Decimal("85000"), currency="usd")
        assert message.subject == f"BTC est passé au-dessus de 85{NBSP}000,00{NBSP}$"

    def test_escapes_coin_data_in_the_html(self):
        message = alert_email(name="<b>Evil</b>", symbol="<i>X</i>")
        assert "<b>Evil</b>" not in message.html_body
        assert "<i>X</i>" not in message.html_body
        assert "&lt;b&gt;Evil&lt;/b&gt;" in message.html_body

    def test_a_coin_symbol_cant_add_headers(self):
        message = alert_email(symbol="BTC\r\nBcc: victim@example.com")
        assert "\n" not in message.subject
        assert "\r" not in message.subject

    def test_links_to_the_site_and_to_a_working_unsubscribe(self):
        message = alert_email()
        assert "https://site.test/alertes" in message.html_body
        assert "https://site.test/alertes" in message.text_body
        for text in (message.html_body, message.text_body, message.headers["List-Unsubscribe"]):
            token = token_after(text, "https://site.test/desabonnement")
            assert read_email_token(token, PURPOSE_STOP_ALERTS) == 7

    def test_unsubscribe_link_cant_confirm_an_address(self):
        token = token_after(alert_email().text_body, "/desabonnement")
        assert read_email_token(token, PURPOSE_CONFIRM_EMAIL) is None


class TestConfirmationEmail:
    def test_carries_a_link_that_confirms_this_user(self):
        message = confirmation_email("user@example.com", 7)
        assert message.to == "user@example.com"
        for text in (message.html_body, message.text_body):
            token = token_after(text, "https://site.test/confirmer-email")
            assert read_email_token(token, PURPOSE_CONFIRM_EMAIL) == 7


class TestPublicUrl:
    def test_falls_back_to_the_first_cors_origin(self, monkeypatch):
        monkeypatch.setattr(settings, "APP_PUBLIC_URL", "")
        monkeypatch.setattr(settings, "CORS_ORIGINS", "https://crypto-explorer.fr, http://other")
        assert settings.PUBLIC_URL == "https://crypto-explorer.fr"

    def test_has_a_last_resort_without_cors_origins(self, monkeypatch):
        monkeypatch.setattr(settings, "APP_PUBLIC_URL", "")
        monkeypatch.setattr(settings, "CORS_ORIGINS", "")
        assert settings.PUBLIC_URL == "http://localhost:3000"
