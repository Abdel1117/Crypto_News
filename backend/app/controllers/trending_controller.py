from fastapi import APIRouter, Depends
from app.services.trending_service import TrendingService
from app.clients.coingecko_client import CoinGeckoClient

router = APIRouter(prefix="/trending", tags=["trending"])


def get_trending_service():
    client = CoinGeckoClient()
    return TrendingService(client)


@router.get("")
async def get_trending(service: TrendingService = Depends(get_trending_service)):
    return await service.get_trending_coins()
