from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.coingecko_client import CoinGeckoClient
from app.core.config import settings
from app.db.session import get_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.alerts.price_alert_sql_repo import SQLPriceAlertRepository
from app.schemas.alerts import (
    AlertCreate,
    AlertOut,
    AlertsOverview,
    AlertUpdate,
    EmailTokenIn,
    UnsubscribeOut,
)
from app.services.alerts.price_alert_service import PriceAlertService
from app.services.email.smtp_email_sender import build_email_sender
from app.services.market_service import MarketService

router = APIRouter(prefix="/alerts", tags=["alerts"])


def get_alert_service(session: AsyncSession = Depends(get_session)) -> PriceAlertService:
    # Without the background check, nothing would ever fire: same as no email.
    sender = build_email_sender() if settings.PRICE_ALERT_INTERVAL > 0 else None
    return PriceAlertService(
        SQLPriceAlertRepository(session), MarketService(CoinGeckoClient()), sender
    )


@router.get("", response_model=AlertsOverview)
async def list_alerts(
    user: User = Depends(get_current_user),
    service: PriceAlertService = Depends(get_alert_service),
):
    return await service.overview(user)


@router.post("", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
async def create_alert(
    data: AlertCreate,
    user: User = Depends(get_current_user),
    service: PriceAlertService = Depends(get_alert_service),
):
    return await service.create(user, data)


# Public: the token in the emailed link is the proof.
@router.post("/unsubscribe", response_model=UnsubscribeOut)
async def unsubscribe(
    data: EmailTokenIn,
    service: PriceAlertService = Depends(get_alert_service),
):
    return UnsubscribeOut(deactivated=await service.unsubscribe(data.token))


@router.patch("/{alert_id}", response_model=AlertOut)
async def update_alert(
    alert_id: int,
    data: AlertUpdate,
    user: User = Depends(get_current_user),
    service: PriceAlertService = Depends(get_alert_service),
):
    return await service.set_active(user, alert_id, data.is_active)


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: int,
    user: User = Depends(get_current_user),
    service: PriceAlertService = Depends(get_alert_service),
) -> None:
    await service.delete(user, alert_id)
