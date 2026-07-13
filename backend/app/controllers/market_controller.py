import asyncio
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from app.services.market_service import MarketService
from app.clients.coingecko_client import CoinGeckoClient
from app.services.ws_manager import manager
from app.utils.mapping_values import convert_Time_Frame

router = APIRouter(prefix="/markets", tags=["markets"])

POLL_INTERVAL = 30  # seconds


def get_market_service():
    client = CoinGeckoClient()
    return MarketService(client)


@router.get("")
async def get_markets(
    currency: str = "eur",
    order: str = "market_cap_desc",
    per_page: int = 10,
    page: int = 1,
    service: MarketService = Depends(get_market_service),
):
    return await service.get_top_markets(currency, order, per_page, page)


@router.get("/markets_view")
async def getMarketView(
    currency: str = "eur", service: MarketService = Depends(get_market_service)
):

    return await service.get_market_view(currency)


@router.get("/get_ohlc")
async def get_ohlc(
    currency: str = "eur",
    selectedTimeFrame: str = "1d",
    cryptoId: str = "bitcoin",
    service: MarketService = Depends(get_market_service),
):
    converted_time_frame = convert_Time_Frame(selectedTimeFrame)
    return await service.get_ohlc(currency, converted_time_frame, cryptoId)


@router.get("/get_top_winners_losers")
async def get_top_winners_losers(
    currency: str = "eur",
    duration: str = "1d",
    price_change_percentage: str = "1d",
    top_coins: str = 300,
    service: MarketService = Depends(get_market_service),
):

    return await service.get_top_gainers_losers(
        currency, duration, price_change_percentage, top_coins
    )


@router.get("/coin")
async def get_market_coin(
    currency: str = "eur",
    cryptoId: str = "bitcoin",
    service: MarketService = Depends(get_market_service),
):
    result = await service.get_market_by_id(currency, cryptoId)
    if result is None:
        return {}
    return result


_poller_task: asyncio.Task | None = None


async def _poll_markets_loop():
    service = get_market_service()
    while True:
        try:
            data = await service.get_top_markets("eur", "market_cap_desc", 10, 1)
            await manager.broadcast("markets", data)
        except Exception:
            pass
        await asyncio.sleep(POLL_INTERVAL)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global _poller_task
    await manager.connect(websocket)
    if _poller_task is None:
        _poller_task = asyncio.create_task(_poll_markets_loop())
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
