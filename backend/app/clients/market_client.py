from typing import Protocol, Optional, List, Dict


class MarketClient(Protocol):
    async def fetch_markets(
        self,
        currency: str,
        order: str,
        per_page: int,
        page: int,
        ids: Optional[str] = None,
    ) -> List[Dict]: ...

    async def fetch_symbols(self, include_platform: bool) -> List[Dict]: ...

    async def fetch_markets_view(self, currency: str) -> List[Dict]: ...

    async def fetch_ohlc(
        self,
        currency: str,
        selected_time_frame: str,
        crypto_id: str,
    ) -> List[Dict]: ...

    async def fetch_search(self, query: str) -> List[Dict]: ...

    async def fetch_simple_prices(self, ids: str, currencies: str) -> Dict[str, Dict]: ...
