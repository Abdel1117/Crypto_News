from typing import Protocol, List, Dict


class MarketClient(Protocol):
    async def fetch_markets(
        self, currency: str, order: str, per_page: int, page: int
    ) -> List[Dict]:
        pass

    async def fetch_symbols(self, include_platform: bool) -> List[Dict]:
        pass
