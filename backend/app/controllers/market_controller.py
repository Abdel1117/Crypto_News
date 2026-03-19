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


@router.get("/get_ohlc")
async def get_ohlc(
    currency: str = "eur",
    selectedTimeFrame: str = "1d",
    cryptoId: str = "bitcoin",
    service: MarketService = Depends(get_market_service),
):

    converted_time_frame = convert_Time_Frame(selectedTimeFrame)
    print(converted_time_frame)
    return await service.get_ohlc(currency, converted_time_frame, cryptoId)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    service = get_market_service()
    currency = "eur"
    try:
        while True:
            # Fetch and push market data
            data = await service.get_top_markets(currency, "market_cap_desc", 10, 1)
            await manager.broadcast("markets", data)

            # Wait for client messages (currency change) or timeout
            try:
                msg = await asyncio.wait_for(
                    websocket.receive_json(), timeout=POLL_INTERVAL
                )
                if "currency" in msg:
                    currency = msg["currency"]
            except asyncio.TimeoutError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
