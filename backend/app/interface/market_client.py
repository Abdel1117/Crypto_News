from abc import ABC, abstractmethod
from typing import Dict, List, Optional


class AbstractMarketClient(ABC):
    @abstractmethod
    async def fetch_markets(
        self,
        currency: str,
        order: str,
        per_page: int,
        page: int,
        ids: Optional[str] = None,
    ) -> List[Dict]: ...

    @abstractmethod
    async def fetch_symbols(self, include_platform: bool) -> List[Dict]: ...

    @abstractmethod
    async def fetch_markets_view(self, currency: str) -> List[Dict]: ...

    @abstractmethod
    async def fetch_ohlc(
        self,
        currency: str,
        selected_time_frame: str,
        crypto_id: str,
    ) -> List[Dict]: ...

    @abstractmethod
    async def fetch_search(self, query: str) -> List[Dict]: ...

    @abstractmethod
    async def fetch_simple_prices(self, ids: str, currencies: str) -> Dict[str, Dict]: ...
