import httpx
from app.core.config import settings


class CoinGeckoClient:

    BASE_URL = "https://api.coingecko.com/api/v3"

    async def fetch_markets(self, currency: str, order: str, per_page: int, page: int):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/coins/markets",
                params={
                    "vs_currency": currency,
                    "order": order,
                    "per_page": per_page,
                    "page": page,
                },
                headers={"x-cg-demo-api-key": settings.API_KEY_COINGECKO},
            )
            response.raise_for_status()
            return response.json()

    async def fetch_symbols(self, include_platform: bool):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/coins/list?inlcude_platform={include_platform}"
            )

            response.raise_for_status()

            return response.json()
