"""The emails sent to users, in French like the rest of the site.

Coin names and symbols come from CoinGecko, so they are escaped like any
outside input.
"""

import html
from decimal import Decimal

from app.auth.email_tokens import PURPOSE_CONFIRM_EMAIL, PURPOSE_STOP_ALERTS, create_email_token
from app.core.config import settings
from app.services.email.email_sender import EmailMessage, single_line

NBSP = " "
CURRENCY_SYMBOLS = {"eur": "€", "usd": "$"}


def format_price(value: Decimal, currency: str) -> str:
    """French format, keeping the decimals of tiny prices: "50 000,00 €", "0,00001234 $"."""
    whole, _, decimals = f"{value:.12f}".partition(".")
    grouped = f"{int(whole):,}".replace(",", NBSP)
    decimals = decimals.rstrip("0").ljust(2, "0")
    return f"{grouped},{decimals}{NBSP}{CURRENCY_SYMBOLS[currency]}"


def _link(path: str, token: str | None = None) -> str:
    query = f"?token={token}" if token else ""
    return f"{settings.PUBLIC_URL}{path}{query}"


def _anchor(url: str, label: str) -> str:
    return f'<a href="{html.escape(url, quote=True)}" style="color: #5b3fd6;">{label}</a>'


def _layout(title: str, body: str, footer: str) -> str:
    return f"""\
<html>
  <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
    <h2 style="font-size: 20px; margin: 24px 0 16px;">{title}</h2>
    {body}
    <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
    <p style="font-size: 12px; line-height: 1.5; color: #777;">{footer}</p>
  </body>
</html>
"""


def confirmation_email(to: str, user_id: int) -> EmailMessage:
    link = _link("/confirmer-email", create_email_token(user_id, PURPOSE_CONFIRM_EMAIL))
    body = f"""\
<p style="line-height: 1.6;">Pour recevoir tes alertes de prix, confirme que cette adresse est bien la tienne.</p>
<p>{_anchor(link, "Confirmer mon adresse e-mail")}</p>
<p style="line-height: 1.6;">Ce lien reste valable 24 heures.</p>"""
    return EmailMessage(
        to=to,
        subject="Confirme ton adresse e-mail",
        html_body=_layout(
            "Confirme ton adresse e-mail",
            body,
            "Si tu n'as rien demandé, ignore cet e-mail : tu ne recevras aucune alerte.",
        ),
        text_body=(
            "Pour recevoir tes alertes de prix, confirme que cette adresse est bien la tienne :\n"
            f"{link}\n\n"
            "Ce lien reste valable 24 heures.\n"
            "Si tu n'as rien demandé, ignore cet e-mail : tu ne recevras aucune alerte.\n"
        ),
    )


def price_alert_email(
    to: str,
    user_id: int,
    *,
    symbol: str,
    name: str,
    direction: str,
    threshold: Decimal,
    price: Decimal,
    currency: str,
) -> EmailMessage:
    threshold_text = format_price(threshold, currency)
    price_text = format_price(price, currency)
    position = "sous" if direction == "below" else "au-dessus de"
    title = f"{symbol} est passé {position} {threshold_text}"

    manage = _link("/alertes")
    stop = _link("/desabonnement", create_email_token(user_id, PURPOSE_STOP_ALERTS))
    notice = "Prix fourni par CoinGecko, à titre d'information : ceci n'est pas un conseil en investissement."

    body = f"""\
<p style="line-height: 1.6;">{html.escape(name)} ({html.escape(symbol)}) vaut <strong>{price_text}</strong>.</p>
<p style="line-height: 1.6;">Cette alerte est maintenant désactivée. Tu peux la réactiver depuis {_anchor(manage, "tes alertes")}.</p>"""
    footer = (
        f"{notice} Tu reçois cet e-mail car tu as créé cette alerte sur Crypto-Explorer. "
        f"{_anchor(stop, 'Désactiver toutes mes alertes')}"
    )
    return EmailMessage(
        to=to,
        subject=single_line(title),
        html_body=_layout(html.escape(title), body, footer),
        text_body=(
            f"{title}\n\n"
            f"{name} ({symbol}) vaut {price_text}.\n"
            f"Cette alerte est maintenant désactivée. Tu peux la réactiver ici : {manage}\n\n"
            f"{notice}\n"
            f"Désactiver toutes mes alertes : {stop}\n"
        ),
        headers={"List-Unsubscribe": f"<{stop}>"},
    )
