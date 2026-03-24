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
            }
            for coin in data
        ]

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
