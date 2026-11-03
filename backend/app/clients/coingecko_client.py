import time
import httpx
from app.core.config import settings
from typing import Optional, List, Dict

_CACHE_TTL = 30  # seconds — matches the markets WS poll interval
# Keys come from request parameters (search text, coin id...), so the cache is
# capped: past this size, entries too old to serve as a stale fallback go first,
# then the oldest ones.
_CACHE_MAX_ENTRIES = 500
_STALE_MAX_AGE = 600  # seconds
_cache: Dict[str, tuple[float, object]] = {}


def _cache_key(name: str, *args) -> str:
    return f"{name}:{args}"


def _cache_get_fresh(key: str):
    entry = _cache.get(key)
    if entry and time.monotonic() - entry[0] < _CACHE_TTL:
        return entry[1]
    return None


def _cache_get_stale(key: str):
    entry = _cache.get(key)
    return entry[1] if entry else None


def _cache_set(key: str, value) -> None:
    now = time.monotonic()
    if key not in _cache and len(_cache) >= _CACHE_MAX_ENTRIES:
        for old_key, (stored_at, _) in list(_cache.items()):
            if now - stored_at > _STALE_MAX_AGE:
                del _cache[old_key]
        while len(_cache) >= _CACHE_MAX_ENTRIES:
            del _cache[next(iter(_cache))]  # dicts keep insertion order: oldest first
    _cache.pop(key, None)  # re-insert so refreshed entries count as newest
    _cache[key] = (now, value)


def clear_cache() -> None:
    """Reset the shared cache. Used by tests to avoid cross-test pollution."""
    _cache.clear()


class CoinGeckoClient:

    BASE_URL = "https://api.coingecko.com/api/v3"

    async def fetch_markets(
        self,
        currency: str,
        order: str,
        per_page: int,
        page: int,
        sparkline: bool = False,
        ids: Optional[str] = None,
    ):
        key = _cache_key("fetch_markets", currency, order, per_page, page, sparkline, ids)
        cached = _cache_get_fresh(key)
        if cached is not None:
            return cached

        params = {
            "vs_currency": currency,
            "order": order,
            "per_page": per_page,
            "page": page,
            "sparkline": str(sparkline).lower(),
        }
        if ids:
            params["ids"] = ids

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/coins/markets",
                    params=params,
                    headers={"x-cg-demo-api-key": settings.API_KEY_COINGECKO},
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError:
            stale = _cache_get_stale(key)
            if stale is not None:
                return stale
            raise

        _cache_set(key, data)
        return data

    async def fetch_markets_view(self, currency: str = "eur"):
        key = _cache_key("fetch_markets_view", currency)
        cached = _cache_get_fresh(key)
        if cached is not None:
            return cached

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/global",
                    headers={"x-cg-demo-api-key": settings.API_KEY_COINGECKO},
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError:
            stale = _cache_get_stale(key)
            if stale is not None:
                return stale
            raise

        _cache_set(key, data)
        return data

    async def fetch_symbols(self, include_platform: bool):
        key = _cache_key("fetch_symbols", include_platform)
        cached = _cache_get_fresh(key)
        if cached is not None:
            return cached

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/coins/list?inlcude_platform={include_platform}"
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError:
            stale = _cache_get_stale(key)
            if stale is not None:
                return stale
            raise

        _cache_set(key, data)
        return data

    async def fetch_ohlc(
        self,
        currency: str,
        selectedTimeFrame: str,
        cryptoId: str,
    ) -> List[Dict]:
        key = _cache_key("fetch_ohlc", currency, selectedTimeFrame, cryptoId)
        cached = _cache_get_fresh(key)
        if cached is not None:
            return cached

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/coins/{cryptoId}/ohlc",
                    params={
                        "vs_currency": currency,
                        "days": selectedTimeFrame,
                    },
                    headers={"x-cg-demo-api-key": settings.API_KEY_COINGECKO},
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError:
            stale = _cache_get_stale(key)
            if stale is not None:
                return stale
            raise

        _cache_set(key, data)
        return data

    async def fetch_trending(self) -> List[Dict]:
        key = _cache_key("fetch_trending")
        cached = _cache_get_fresh(key)
        if cached is not None:
            return cached

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/search/trending",
                    headers={"x-cg-demo-api-key": settings.API_KEY_COINGECKO},
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError:
            stale = _cache_get_stale(key)
            if stale is not None:
                return stale
            raise

        _cache_set(key, data)
        return data

    async def fetch_search(self, query: str) -> List[Dict]:
        # Cached like the other calls: search runs on every keystroke in the UI.
        key = _cache_key("fetch_search", query.strip().lower())
        cached = _cache_get_fresh(key)
        if cached is not None:
            return cached

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/search",
                params={"query": query},
                headers={"x-cg-demo-api-key": settings.API_KEY_COINGECKO},
            )
            response.raise_for_status()
            coins = response.json().get("coins", [])

        _cache_set(key, coins)
        return coins
