from decimal import Decimal

import httpx
import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlmodel import SQLModel

from app.models.simulation import SimSnapshot
from app.models.user import User
from app.repositories.simulation.simulation_sql_repo import SQLSimulationRepository
from app.schemas.simulation import PortfolioCreate, PortfolioUpdate, TradeCreate
from app.services.simulation.simulation_service import SimulationError, SimulationService


class FakeMarket:
    """Stands in for MarketService: fixed prices, no network."""

    def __init__(self, prices=None):
        self.prices = dict(prices or {"bitcoin": 100.0, "ethereum": 10.0})
        self.fail = False

    async def get_market_by_id(self, currency, coin_id):
        if self.fail:
            raise httpx.ConnectError("down")
        if coin_id not in self.prices:
            return None
        return {
            "id": coin_id,
            "symbol": coin_id[:3],
            "name": coin_id.capitalize(),
            "image": f"https://img/{coin_id}.png",
            "price": self.prices[coin_id],
        }

    async def get_prices(self, currency, coin_ids):
        return {c: self.prices[c] for c in coin_ids if c in self.prices}

    async def get_exchange_rate(self, base, quote):
        return {"base": base, "quote": quote, "rate": 1.1}


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite://")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    async with AsyncSession(engine, expire_on_commit=False) as s:
        yield s
    await engine.dispose()


@pytest.fixture
async def user_id(session):
    user = User(full_name="Test", email="sim@example.com")
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user.id


@pytest.fixture
def market():
    return FakeMarket()


@pytest.fixture
def service(session, market):
    return SimulationService(SQLSimulationRepository(session), market)


def create(capital="10000", currency="eur", country="FR"):
    return PortfolioCreate(initial_capital=Decimal(capital), currency=currency, country=country)


def buy(coin="bitcoin", quantity=None, amount=None):
    return TradeCreate(
        coin_id=coin,
        side="buy",
        quantity=Decimal(str(quantity)) if quantity is not None else None,
        amount=Decimal(str(amount)) if amount is not None else None,
    )


def sell(coin="bitcoin", quantity="1"):
    return TradeCreate(coin_id=coin, side="sell", quantity=Decimal(str(quantity)))


class TestPortfolio:
    async def test_new_portfolio_starts_with_its_capital(self, service, user_id):
        view = await service.create(user_id, create("25000", "usd", "US"))
        assert view.cash == 25000
        assert view.total_value == 25000
        assert view.currency == "usd"
        assert view.country == "US"
        assert view.fee_rate == pytest.approx(0.001)
        assert [p.value for p in view.history] == [25000]

    async def test_only_one_portfolio_per_user(self, service, user_id):
        await service.create(user_id, create())
        with pytest.raises(SimulationError) as exc:
            await service.create(user_id, create())
        assert exc.value.status_code == 409

    async def test_missing_portfolio_is_404(self, service, user_id):
        with pytest.raises(SimulationError) as exc:
            await service.view(user_id)
        assert exc.value.status_code == 404


class TestTrades:
    async def test_buy_by_amount_spends_at_most_the_amount(self, service, user_id):
        await service.create(user_id, create())
        trade = await service.place_trade(user_id, buy(amount="1000"))

        assert trade.total <= 1000
        assert trade.total == pytest.approx(1000, abs=0.01)
        assert trade.fee == pytest.approx(trade.gross * 0.001, abs=1e-8)
        view = await service.view(user_id)
        assert view.cash == pytest.approx(9000, abs=0.01)
        assert view.positions[0].quantity == pytest.approx(1000 / 1.001 / 100, rel=1e-9)

    async def test_buy_by_quantity_pays_the_fee_on_top(self, service, user_id):
        await service.create(user_id, create())
        trade = await service.place_trade(user_id, buy(quantity=2))
        assert trade.gross == 200
        assert trade.fee == pytest.approx(0.2)
        assert trade.total == pytest.approx(200.2)

    async def test_cannot_spend_more_than_the_cash(self, service, user_id):
        await service.create(user_id, create("1000"))
        with pytest.raises(SimulationError) as exc:
            await service.place_trade(user_id, buy(quantity=10))  # 1000 + 1 fee
        assert exc.value.status_code == 409

    async def test_price_comes_from_the_server(self, service, user_id, market):
        await service.create(user_id, create())
        market.prices["bitcoin"] = 123.45
        trade = await service.place_trade(user_id, buy(quantity=1))
        assert trade.price == pytest.approx(123.45)

    async def test_sell_at_a_profit(self, service, user_id, market):
        await service.create(user_id, create())
        await service.place_trade(user_id, buy(quantity=10))  # 1000 + 1 fee
        market.prices["bitcoin"] = 200.0
        trade = await service.place_trade(user_id, sell(quantity=5))

        # proceeds 1000 − 1 fee; cost of half the position 500.5
        assert trade.realized_pnl == pytest.approx(498.5)
        view = await service.view(user_id)
        assert view.pnl.realized == pytest.approx(498.5)
        # 5 BTC left worth 1000 for a cost of 500.5
        assert view.pnl.unrealized == pytest.approx(499.5)
        assert view.pnl.total == pytest.approx(view.pnl.realized + view.pnl.unrealized)

    async def test_cannot_sell_more_than_held(self, service, user_id):
        await service.create(user_id, create())
        await service.place_trade(user_id, buy(quantity=1))
        with pytest.raises(SimulationError) as exc:
            await service.place_trade(user_id, sell(quantity=2))
        assert exc.value.status_code == 409

    async def test_cannot_sell_a_coin_not_held(self, service, user_id):
        await service.create(user_id, create())
        with pytest.raises(SimulationError) as exc:
            await service.place_trade(user_id, sell(coin="ethereum"))
        assert exc.value.status_code == 409

    async def test_selling_everything_closes_the_position(self, service, user_id):
        await service.create(user_id, create())
        await service.place_trade(user_id, buy(amount="777.77"))
        held = (await service.view(user_id)).positions[0].quantity
        await service.place_trade(user_id, sell(quantity=f"{held:.12f}"))
        assert (await service.view(user_id)).positions == []

    async def test_unknown_coin_is_404(self, service, user_id):
        await service.create(user_id, create())
        with pytest.raises(SimulationError) as exc:
            await service.place_trade(user_id, buy(coin="nope", quantity=1))
        assert exc.value.status_code == 404

    async def test_no_price_service_is_503(self, service, user_id, market):
        await service.create(user_id, create())
        market.fail = True
        with pytest.raises(SimulationError) as exc:
            await service.place_trade(user_id, buy(quantity=1))
        assert exc.value.status_code == 503

    async def test_tiny_orders_are_refused(self, service, user_id):
        await service.create(user_id, create())
        with pytest.raises(SimulationError) as exc:
            await service.place_trade(user_id, buy(amount="0.5"))
        assert exc.value.status_code == 422

    async def test_history_lists_newest_first_with_gains(self, service, user_id, market):
        await service.create(user_id, create())
        await service.place_trade(user_id, buy(quantity=10))
        market.prices["bitcoin"] = 150.0
        await service.place_trade(user_id, sell(quantity=4))
        page = await service.trades(user_id, limit=1, offset=0)
        assert page.total == 2
        assert page.items[0].side == "sell"
        assert page.items[0].realized_pnl is not None
        assert page.items[0].taxable_gain is not None


class TestTaxAndCountry:
    async def test_french_tax_on_a_sale(self, service, user_id, market):
        await service.create(user_id, create(country="FR"))
        await service.place_trade(user_id, buy(quantity=10))
        market.prices["bitcoin"] = 300.0
        await service.place_trade(user_id, sell(quantity=5))
        view = await service.view(user_id)
        assert len(view.tax.years) == 1
        assert view.tax.total > 0
        assert view.pnl.after_tax == pytest.approx(view.pnl.total - view.tax.total)

    async def test_changing_country_recomputes_the_tax(self, service, user_id, market):
        await service.create(user_id, create(country="FR"))
        await service.place_trade(user_id, buy(quantity=10))
        market.prices["bitcoin"] = 300.0
        await service.place_trade(user_id, sell(quantity=5))

        view = await service.update_country(user_id, PortfolioUpdate(country="CH"))
        assert view.country == "CH"
        assert view.tax.total == 0

    async def test_dollar_portfolio_converts_exemptions(self, service, user_id):
        view = await service.create(user_id, create("5000", "usd", "GB"))
        assert view.tax.fx_estimated is False


class TestResetAndValuation:
    async def test_reset_clears_history_and_applies_new_settings(self, service, user_id):
        await service.create(user_id, create())
        await service.place_trade(user_id, buy(quantity=1))
        view = await service.reset(user_id, create("5000", "usd", "US"))

        assert view.cash == 5000
        assert view.currency == "usd"
        assert view.positions == []
        assert (await service.trades(user_id, 50, 0)).total == 0

    async def test_missing_live_price_uses_the_last_trade_price(self, service, user_id, market):
        await service.create(user_id, create())
        await service.place_trade(user_id, buy(quantity=1))
        del market.prices["bitcoin"]
        position = (await service.view(user_id)).positions[0]
        assert position.price_stale
        assert position.price == pytest.approx(100)

    async def test_snapshots_keep_one_row_per_day(self, service, session, user_id):
        await service.create(user_id, create())
        assert await service.snapshot_all() == 1
        assert await service.snapshot_all() == 1
        count = await session.execute(select(func.count()).select_from(SimSnapshot))
        assert count.scalar_one() == 1


class TestQuotes:
    async def test_prices_only_the_coins_held(self, service, user_id):
        await service.create(user_id, create())
        await service.place_trade(user_id, buy(quantity=1))
        quotes = await service.quotes(user_id)
        assert quotes.prices == {"bitcoin": 100.0}  # ethereum has a price but isn't held
        assert quotes.stale == []

    async def test_lists_coins_without_a_live_price(self, service, user_id, market):
        await service.create(user_id, create())
        await service.place_trade(user_id, buy(quantity=1))
        del market.prices["bitcoin"]
        quotes = await service.quotes(user_id)
        assert quotes.prices == {}
        assert quotes.stale == ["bitcoin"]

    async def test_writes_nothing(self, service, session, user_id):
        await service.create(user_id, create())
        await service.place_trade(user_id, buy(quantity=1))
        before = (await session.execute(select(func.count()).select_from(SimSnapshot))).scalar_one()
        for _ in range(3):
            await service.quotes(user_id)
        after = (await session.execute(select(func.count()).select_from(SimSnapshot))).scalar_one()
        assert after == before

    async def test_nothing_held_means_nothing_to_price(self, service, user_id):
        await service.create(user_id, create())
        quotes = await service.quotes(user_id)
        assert quotes.prices == {}
        assert quotes.stale == []

    async def test_missing_portfolio_is_404(self, service, user_id):
        with pytest.raises(SimulationError) as exc:
            await service.quotes(user_id)
        assert exc.value.status_code == 404
