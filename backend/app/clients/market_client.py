from typing import Protocol, List, Dict


class MarketClient(Protocol):
    async def fetch_markets(
        self, currency: str, order: str, per_page: int, page: int
    ) -> List[Dict]:
        pass
