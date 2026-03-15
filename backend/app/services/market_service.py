from app.clients.market_client import MarketClient


class MarketService:
    def __init__(self, client: MarketClient):
        self.client = client

    async def get_top_markets(
        self, currency: str, order: str, per_page: int, page: int
    ):
        data = await self.client.fetch_markets(currency, order, per_page, page)
        print("*" * 50)
        print(data)
        print("*" * 50)
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
