from typing import Protocol, Optional, List, Dict


class MarketClient(Protocol):
    async def fetch_markets(
        self,
        currency: str,
        order: str,
        per_page: int,
        page: int,
        ids: Optional[str] = None,
    ) -> List[Dict]:
        pass

    async def fetch_symbols(self, include_platform: bool) -> List[Dict]:
        pass

    async def fetch_markets_view(self, currency: str) -> List[Dict]:
        pass

    async def fetch_ohlc(
        self,
        currency: str,
        selectedTimeFrame: str,
        cryptoId: str,
    ) -> List[Dict]:
        pass

    async def fetch_search(self, query: str) -> List[Dict]:
        pass
