from fastapi import APIRouter, Depends, Query
from app.services.symbols_service import SymbolesService
from app.clients.coingecko_client import CoinGeckoClient
from app.controllers.market_controller import Currency, Order

router = APIRouter(prefix="/symbols", tags=["symbols"])


def get_symbols_services():
    client = CoinGeckoClient()
    return SymbolesService(client)


@router.get("")
async def get_markets(
    currency: Currency = "eur",
    order: Order = "market_cap_desc",
    per_page: int = Query(10, ge=1, le=250),
    page: int = Query(1, ge=1, le=100),
    service: SymbolesService = Depends(get_symbols_services),
):
    return await service.get_list_symbol(currency, order, per_page, page)


@router.get("/search")
async def search_symbols(
    query: str = Query(..., min_length=1, max_length=50),
    per_page: int = Query(10, ge=1, le=25),
    service: SymbolesService = Depends(get_symbols_services),
):
    return await service.search_symbols(query, per_page)
