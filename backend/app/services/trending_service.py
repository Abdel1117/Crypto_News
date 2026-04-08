from app.clients.market_client import MarketClient


class TrendingService:
    def __init__(self, client):
        self.client = client

    async def get_trending_coins(self):
        data = await self.client.fetch_trending()
        coins = data.get("coins", [])

        return [
            {
                "id": item["id"],
                "name": item["name"],
                "symbol": item["symbol"],
                "market_cap_rank": item.get("market_cap_rank"),
                "image": item.get("small"),
                "price_btc": item.get("price_btc"),
                "score": item.get("score"),
                "price": item.get("data", {}).get("price"),
                "price_change_24h": item.get("data", {})
                .get("price_change_percentage_24h", {})
                .get("usd"),
                "market_cap": item.get("data", {}).get("market_cap"),
                "total_volume": item.get("data", {}).get("total_volume"),
                "sparkline": item.get("data", {}).get("sparkline"),
            }
            for coin in coins
            if (item := coin.get("item"))
        ]
