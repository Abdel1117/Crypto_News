import asyncio
import json
import logging
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from app.services.market_service import MarketService
from app.clients.coingecko_client import CoinGeckoClient
from app.services.ws_manager import manager
from app.utils.mapping_values import convert_Time_Frame

router = APIRouter(prefix="/markets", tags=["markets"])
logger = logging.getLogger(__name__)

POLL_INTERVAL = 30  # seconds

# Every value below ends up in a CoinGecko request and in the shared cache key,
# so only values the app actually uses are accepted (anything else is a 422).
Currency = Literal["eur", "usd"]
Order = Literal[
    "market_cap_desc", "market_cap_asc", "volume_desc", "volume_asc", "id_asc", "id_desc"
]
TimeFrame = Literal["1h", "1d", "1w", "1m", "1y", "max"]
# CoinGecko ids: lowercase letters, digits, dots, dashes, underscores. No slash,
# so the id can't change which CoinGecko endpoint the request goes to.
CoinId = Annotated[str, Query(pattern=r"^[a-z0-9][a-z0-9._-]{0,99}$")]


def get_market_service():
    client = CoinGeckoClient()
    return MarketService(client)


@router.get("")
async def get_markets(
    currency: Currency = "eur",
    order: Order = "market_cap_desc",
    per_page: int = Query(20, ge=1, le=250),
    page: int = Query(1, ge=1, le=100),
    service: MarketService = Depends(get_market_service),
):
    return await service.get_top_markets(currency, order, per_page, page)


@router.get("/markets_view")
async def getMarketView(
    currency: Currency = "eur", service: MarketService = Depends(get_market_service)
):

    return await service.get_market_view(currency)


@router.get("/get_ohlc")
async def get_ohlc(
    currency: Currency = "eur",
    selectedTimeFrame: TimeFrame = "1d",
    cryptoId: CoinId = "bitcoin",
    service: MarketService = Depends(get_market_service),
):
    converted_time_frame = convert_Time_Frame(selectedTimeFrame)
    return await service.get_ohlc(currency, converted_time_frame, cryptoId)


@router.get("/get_top_winners_losers")
async def get_top_winners_losers(
    currency: Currency = "eur",
    # Not used by the service (moves are always over 24h); kept for compatibility.
    duration: str = Query("1d", max_length=10),
    price_change_percentage: str = Query("1d", max_length=10),
    top_coins: int = Query(300, ge=10, le=300),
    service: MarketService = Depends(get_market_service),
):

    return await service.get_top_gainers_losers(
        currency, duration, price_change_percentage, top_coins
    )


@router.get("/coin")
async def get_market_coin(
    currency: Currency = "eur",
    cryptoId: CoinId = "bitcoin",
    service: MarketService = Depends(get_market_service),
):
    result = await service.get_market_by_id(currency, cryptoId)
    if result is None:
        return {}
    return result


@router.get("/exchange-rate")
async def get_exchange_rate(
    base: Currency = "eur",
    quote: Currency = "usd",
    service: MarketService = Depends(get_market_service),
):
    result = await service.get_exchange_rate(base, quote)
    if result is None:
        return {}
    return result


SUPPORTED_CURRENCIES = ("eur", "usd")

_poller_task: asyncio.Task | None = None
_last_markets_data: dict[str, object] | None = None


async def _poll_markets_loop():
    global _last_markets_data
    service = get_market_service()
    while True:
        try:
            _last_markets_data = {
                currency: await service.get_top_markets(
                    currency, "market_cap_desc", 20, 1
                )
                for currency in SUPPORTED_CURRENCIES
            }
            await manager.broadcast_per_currency("markets", _last_markets_data)
        except asyncio.CancelledError:
            raise
        except Exception:
            # Keep polling (the next tick may succeed), but leave a trace.
            logger.exception("Market poll failed")
        await asyncio.sleep(POLL_INTERVAL)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global _poller_task
    await manager.connect(websocket, currency="eur")
    if _poller_task is None:
        _poller_task = asyncio.create_task(_poll_markets_loop())
    elif _last_markets_data is not None:
        # Poller already running: give the new client the latest snapshot
        # right away instead of waiting up to POLL_INTERVAL for the next tick.
        await manager.send_to(websocket, "markets", _last_markets_data["eur"])
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except (TypeError, ValueError):
                continue
            currency = message.get("currency") if isinstance(message, dict) else None
            if currency not in SUPPORTED_CURRENCIES:
                continue
            manager.set_currency(websocket, currency)
            if _last_markets_data is not None:
                await manager.send_to(websocket, "markets", _last_markets_data[currency])
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("WebSocket connection failed")
    finally:
        # Any way the connection ends, forget it, and stop polling when nobody listens.
        manager.disconnect(websocket)
        if not manager.has_clients() and _poller_task is not None:
            _poller_task.cancel()
            _poller_task = None
