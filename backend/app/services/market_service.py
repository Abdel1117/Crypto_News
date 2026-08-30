from app.clients.market_client import MarketClient


class MarketService:
    def __init__(self, client: MarketClient):
        self.client = client

    async def get_top_markets(
        self, currency: str, order: str, per_page: int, page: int
    ):
        data = await self.client.fetch_markets(currency, order, per_page, page)

        return [
            {
                "id": coin["id"],
                "symbol": coin["symbol"].upper(),
                "name": coin["name"],
                "image": coin["image"],
                "price": coin["current_price"],
                "market_cap": coin["market_cap"],
                "change_24h": coin["price_change_percentage_24h"],
                "volume_24h": coin["total_volume"],
            }
            for coin in data
        ]

    async def get_market_by_id(self, currency: str, crypto_id: str):
        data = await self.client.fetch_markets(
            currency, "market_cap_desc", 1, 1, False, ids=crypto_id
        )
        if not data:
            return None
        coin = data[0]
        return {
            "id": coin["id"],
            "symbol": coin["symbol"].upper(),
            "name": coin["name"],
            "image": coin["image"],
            "price": coin["current_price"],
            "market_cap": coin["market_cap"],
            "change_24h": coin["price_change_percentage_24h"],
            "volume_24h": coin["total_volume"],
        }

    async def get_market_view(self, currency: str):
        data = await self.client.fetch_markets_view(currency)
        return {
            "total_market_cap": data["data"]["total_market_cap"].get(currency, None),
            "total_volume": data["data"]["total_volume"].get(currency, None),
            "market_cap_percentage": data["data"]["market_cap_percentage"].get(
                "btc", None
            ),
            "market_cap_change_percentage_24h": data["data"].get(
                f"market_cap_change_percentage_24h_usd", None
            ),
            "volume_change_percentage_24h": data["data"].get(
                f"volume_change_percentage_24h_usd", None
            ),
        }

    async def get_ohlc(
        self,
        currency: str,
        selectedTimeFrame: str,
        cryptoId: str,
    ):
        data = await self.client.fetch_ohlc(currency, selectedTimeFrame, cryptoId)
        return data

    async def get_exchange_rate(
        self, base: str = "eur", quote: str = "usd", reference_coin: str = "bitcoin"
    ):
        base_data = await self.client.fetch_markets(
            base, "market_cap_desc", 1, 1, ids=reference_coin
        )
        quote_data = await self.client.fetch_markets(
            quote, "market_cap_desc", 1, 1, ids=reference_coin
        )
        if not base_data or not quote_data:
            return None
      
        base_price = base_data[0]["current_price"]
        quote_price = quote_data[0]["current_price"]
        if not base_price:
            return None

        return {"base": base, "quote": quote, "rate": quote_price / base_price}

    async def get_top_gainers_losers(
        self,
        currency: str,
        duration: str,
        price_change_percentage: str,
        top_coins: str,
    ):
        data = await self.client.fetch_markets(
            currency, "market_cap_desc", int(top_coins), 1, sparkline=True
        )

        change_key = "price_change_percentage_24h"

        valid = [c for c in data if c.get(change_key) is not None]

        sorted_desc = sorted(valid, key=lambda c: c[change_key], reverse=True)
        sorted_asc = sorted(valid, key=lambda c: c[change_key])

        def map_coin(coin: dict) -> dict:
            return {
                "id": coin.get("id"),
                "symbol": coin.get("symbol", "").upper(),
                "name": coin.get("name"),
                "image": coin.get("image"),
                "price": coin.get("current_price"),
                "market_cap": coin.get("market_cap"),
                "price_change_percentage": coin.get(change_key),
                "sparkline": coin.get("sparkline_in_7d", {}).get("price", []),
            }

        return {
            "top_gainers": [map_coin(c) for c in sorted_desc[:10]],
            "top_losers": [map_coin(c) for c in sorted_asc[:10]],
        }
