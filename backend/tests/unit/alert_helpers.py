"""Fakes shared by the alert and email confirmation tests: no network, no SMTP."""

import httpx


class FakeSender:
    def __init__(self):
        self.sent = []
        self.fail_for: set[str] = set()
        self.fail_all = False

    async def send(self, message):
        if self.fail_all or message.to in self.fail_for:
            raise OSError("SMTP down")
        self.sent.append(message)


class FakeMarket:
    """Stands in for MarketService: prices per currency, and a count of the calls made."""

    def __init__(self, prices=None):
        self.prices = prices if prices is not None else {"bitcoin": {"eur": 60000.0, "usd": 65000.0}}
        self.fail = False
        self.live_calls = 0
        self.coin_calls = 0

    async def get_market_by_id(self, currency, coin_id):
        self.coin_calls += 1
        if self.fail:
            raise httpx.ConnectError("down")
        if coin_id not in self.prices:
            return None
        return {
            "id": coin_id,
            "symbol": coin_id[:3].upper(),
            "name": coin_id.capitalize(),
            "image": f"https://img/{coin_id}.png",
            "price": self.prices[coin_id].get(currency),
        }

    async def get_live_prices(self, coin_ids, currencies):
        self.live_calls += 1
        list(coin_ids), list(currencies)  # consumed like the real one
        if self.fail:
            raise httpx.ConnectError("down")
        return self.prices
