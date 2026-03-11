import asyncio
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from app.services.market_service import MarketService
from app.clients.coingecko_client import CoinGeckoClient
from app.services.ws_manager import manager

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
