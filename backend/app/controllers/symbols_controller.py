import asyncio
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from app.services.symbols_service import SymbolesService
from app.clients.coingecko_client import CoinGeckoClient
from app.services.ws_manager import manager

router = APIRouter(prefix="/symbols", tags=["symbols"])

POLL_INTERVAL = 30  # in seconds


def get_symbols_services():
    client = CoinGeckoClient()
    return SymbolesService(client)


@router.get("")
async def get_markets(
    currency: str = "eur",
    order: str = "market_cap_desc",
    per_page: int = 10,
    page: int = 1,
    service: SymbolesService = Depends(get_symbols_services),
):
    return await service.get_list_symbol(currency, order, per_page, page)


@router.get("/search")
async def search_symbols(
    query: str,
    per_page: int = 10,
    service: SymbolesService = Depends(get_symbols_services),
):
    return await service.search_symbols(query, per_page)
