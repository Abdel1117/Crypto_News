"""Price alerts: what users manage, and the check that emails them.

An alert fires at most once, the first time a check sees the price at or past its
threshold. Prices are sampled, so a move that starts and ends between two checks
goes unnoticed.
"""

import asyncio
import logging
from decimal import Decimal

import httpx
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.auth.email_tokens import PURPOSE_STOP_ALERTS, read_email_token
from app.core.config import settings
from app.models.price_alert import PriceAlert
from app.models.user import User
from app.repositories.alerts.price_alert_sql_repo import SQLPriceAlertRepository
from app.schemas.alerts import AlertCreate, AlertOut, AlertsOverview
from app.services.email.email_sender import IEmailSender
from app.services.email.messages import format_price, price_alert_email
from app.services.market_service import MarketService
from app.utils.dates import as_utc, utcnow

logger = logging.getLogger(__name__)

# Includes alerts that already fired: they stay listed until deleted.
MAX_ALERTS_PER_USER = 20


def is_reached(direction: str, threshold: Decimal, price: Decimal) -> bool:
    return price >= threshold if direction == "above" else price <= threshold


def _alert_out(alert: PriceAlert) -> AlertOut:
    return AlertOut(
        id=alert.id,
        coin_id=alert.coin_id,
        symbol=alert.coin_symbol,
        name=alert.coin_name,
        image=alert.coin_image,
        currency=alert.currency,  # type: ignore[arg-type]
        direction=alert.direction,  # type: ignore[arg-type]
        threshold=float(alert.threshold),
        is_active=alert.is_active,
        created_at=as_utc(alert.created_at),
        triggered_at=as_utc(alert.triggered_at) if alert.triggered_at else None,
        triggered_price=float(alert.triggered_price) if alert.triggered_price is not None else None,
    )


class PriceAlertService:
    def __init__(
        self,
        repo: SQLPriceAlertRepository,
        market: MarketService,
        sender: IEmailSender | None,
    ) -> None:
        self.repo = repo
        self.market = market
        self.sender = sender

    # ---------- what the user manages ----------

    async def overview(self, user: User) -> AlertsOverview:
        alerts = await self.repo.list_for_user(user.id)
        return AlertsOverview(
            items=[_alert_out(a) for a in alerts],
            email=user.email,
            email_verified=user.email_verified_at is not None,
            alerts_available=self.sender is not None,
            max_alerts=MAX_ALERTS_PER_USER,
            check_interval_seconds=settings.PRICE_ALERT_INTERVAL,
        )

    def _require_deliverable(self, user: User) -> None:
        if self.sender is None:
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Les alertes ne sont pas disponibles pour le moment.",
            )
        if user.email_verified_at is None:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "Confirme ton adresse e-mail pour activer une alerte.",
            )

    async def _current_coin(self, currency: str, coin_id: str) -> dict:
        try:
            coin = await self.market.get_market_by_id(currency, coin_id)
        except httpx.HTTPError as exc:
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Prix indisponible pour le moment. Réessaie dans un instant.",
            ) from exc
        if coin is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Crypto introuvable.")
        if not coin.get("price") or coin["price"] <= 0:
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE, "Aucun prix disponible pour cette crypto."
            )
        return coin

    @staticmethod
    def _refuse_if_reached(symbol: str, direction: str, threshold: Decimal, price: Decimal, currency: str) -> None:
        """An alert already past its threshold would fire at the next check, which
        isn't what "when it drops below" means."""
        if is_reached(direction, threshold, price):
            position = "sous" if direction == "below" else "au-dessus de"
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"{symbol} est déjà {position} ce seuil (prix actuel : {format_price(price, currency)}).",
            )

    async def create(self, user: User, data: AlertCreate) -> AlertOut:
        self._require_deliverable(user)
        if await self.repo.count_for_user(user.id) >= MAX_ALERTS_PER_USER:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Limite de {MAX_ALERTS_PER_USER} alertes atteinte. "
                "Supprimes-en une pour en créer une nouvelle.",
            )

        coin = await self._current_coin(data.currency, data.coin_id)
        symbol = str(coin.get("symbol", data.coin_id)).upper()[:50]
        self._refuse_if_reached(
            symbol, data.direction, data.threshold, Decimal(str(coin["price"])), data.currency
        )

        alert = PriceAlert(
            user_id=user.id,
            coin_id=data.coin_id,
            coin_symbol=symbol,
            coin_name=str(coin.get("name", data.coin_id))[:200],
            coin_image=str(coin.get("image") or "")[:500],
            currency=data.currency,
            direction=data.direction,
            threshold=data.threshold,
        )
        try:
            await self.repo.add(alert)
            await self.repo.commit()
        except IntegrityError as exc:
            await self.repo.rollback()
            raise HTTPException(status.HTTP_409_CONFLICT, "Tu as déjà cette alerte.") from exc
        return _alert_out(alert)

    async def _owned(self, user: User, alert_id: int) -> PriceAlert:
        alert = await self.repo.get_for_user(alert_id, user.id)
        if alert is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Alerte introuvable.")
        return alert

    async def set_active(self, user: User, alert_id: int, active: bool) -> AlertOut:
        alert = await self._owned(user, alert_id)
        if active and not alert.is_active:
            self._require_deliverable(user)
            coin = await self._current_coin(alert.currency, alert.coin_id)
            self._refuse_if_reached(
                alert.coin_symbol,
                alert.direction,
                Decimal(alert.threshold),
                Decimal(str(coin["price"])),
                alert.currency,
            )
            alert.triggered_at = None
            alert.triggered_price = None
        alert.is_active = active
        await self.repo.commit()
        return _alert_out(alert)

    async def delete(self, user: User, alert_id: int) -> None:
        alert = await self._owned(user, alert_id)
        await self.repo.delete(alert)
        await self.repo.commit()

    async def unsubscribe(self, token: str) -> int:
        """Turns off every alert of the link's owner, without a login.

        No separate opt-out flag: alerts are the only emails sent, so nothing more
        goes out until the user turns one on again.
        """
        user_id = read_email_token(token, PURPOSE_STOP_ALERTS)
        if user_id is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Lien invalide ou expiré.")
        return await self.repo.deactivate_all(user_id)

    # ---------- the check ----------

    async def check_all(self) -> int:
        """Emails every alert whose threshold is reached; returns how many were sent."""
        if self.sender is None:
            return 0
        watched = await self.repo.list_deliverable()
        if not watched:
            return 0  # no CoinGecko call: the quota is shared with the rest of the site

        try:
            prices = await self.market.get_live_prices(
                (alert.coin_id for alert, _ in watched),
                (alert.currency for alert, _ in watched),
            )
        except httpx.HTTPError:
            logger.warning("Price alerts skipped this round: prices unavailable")
            return 0

        sent = 0
        for alert, email in watched:
            raw = prices.get(alert.coin_id, {}).get(alert.currency)
            if raw is None or raw <= 0:
                continue
            price = Decimal(str(raw))
            if is_reached(alert.direction, Decimal(alert.threshold), price):
                sent += await self._fire(alert, email, price)
        return sent

    async def _fire(self, alert: PriceAlert, email: str, price: Decimal) -> bool:
        # Claimed before sending: a crash in between loses this one email rather
        # than sending it again at every check.
        if not await self.repo.claim(alert.id, price, utcnow()):
            return False
        try:
            await self.sender.send(
                price_alert_email(
                    email,
                    alert.user_id,
                    symbol=alert.coin_symbol,
                    name=alert.coin_name,
                    direction=alert.direction,
                    threshold=Decimal(alert.threshold),
                    price=price,
                    currency=alert.currency,
                )
            )
        except Exception:
            logger.exception("Price alert %s could not be emailed", alert.id)
            await self.repo.release(alert.id)
            return False
        return True


async def price_alert_loop(session_factory, market_factory, sender_factory, interval_seconds: int) -> None:
    """Checks every alert, every `interval_seconds`."""
    while True:
        try:
            async with session_factory() as session:
                service = PriceAlertService(
                    SQLPriceAlertRepository(session), market_factory(), sender_factory()
                )
                sent = await service.check_all()
                if sent:
                    logger.info("Price alerts emailed: %s", sent)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Price alert check failed")
        await asyncio.sleep(interval_seconds)
