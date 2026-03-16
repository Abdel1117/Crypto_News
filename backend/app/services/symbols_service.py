from app.clients.market_client import MarketClient


class SymbolesService:
    def __init__(self, client: MarketClient):
        self.client = client

    async def get_list_symbol(
        self, currency: str, order: str, per_page: int, page: int
    ):

        data = await self.client.fetch_markets(currency, order, per_page, page)
        print("*" * 50)
        print(data)
        print(currency)
        print("*" * 50)
        return [
            {
                "id": coin["id"],
                "symbol": coin["symbol"],
                "image": coin["image"],
                "name": coin["name"],
            }
            for coin in data
        ]
