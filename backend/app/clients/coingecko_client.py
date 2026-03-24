import httpx
from app.core.config import settings
from typing import Protocol, List, Dict


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

    async def fetch_markets_view(self, currency: str = "eur"):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/global",
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

    async def fetch_ohlc(
        self,
        currency: str,
        selectedTimeFrame: str,
        cryptoId: str,
    ) -> List[Dict]:
        async with httpx.AsyncClient() as client:
            print("=" * 60)
            print(selectedTimeFrame)
            print("=" * 60)
            response = await client.get(
                f"{self.BASE_URL}/coins/{cryptoId}/ohlc",
                params={
                    "vs_currency": currency,
                    "days": selectedTimeFrame,
                },
                headers={"x-cg-demo-api-key": settings.API_KEY_COINGECKO},
            )

            response.raise_for_status()
            return response.json()
