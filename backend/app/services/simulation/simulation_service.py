"""Logged-in simulation: portfolio settings, server-priced trades, valuation.

The server is the source of truth: it prices every trade itself (a client can't
send its own price), and recomputes the portfolio from the stored trades on
every read (see engine.py). Amounts are exact decimals.
"""

import asyncio
import logging
from datetime import date, datetime, timezone
from decimal import ROUND_DOWN, ROUND_HALF_UP, Decimal

import httpx
from fastapi import HTTPException, status

from app.models.simulation import SimPortfolio, SimTrade
from app.repositories.simulation.simulation_sql_repo import SQLSimulationRepository
from app.schemas.simulation import (
    CountryOut,
    HistoryPoint,
    PnlOut,
    PortfolioCreate,
    PortfolioOut,
    PortfolioUpdate,
    PositionOut,
    RiskOut,
    SaleOut,
    SourceOut,
    TaxOut,
    TaxYearOut,
    TradeCreate,
    TradeOut,
    TradesPage,
    QuotesOut,
    TradeStatsOut,
)
from app.services.market_service import MarketService
from app.services.simulation.engine import ZERO, ReplayResult, TradeRecord, replay
from app.services.simulation.metrics import risk_stats, trade_stats
from app.services.simulation.tax import estimate_tax
from app.services.simulation.tax_rules import TAX_RULES, VERIFIED_ON, TaxRule, get_rule

logger = logging.getLogger(__name__)

QUANTITY_STEP = Decimal("0.000000000001")  # 12 decimals, as stored
MONEY_STEP = Decimal("0.00000001")  # 8 decimals, as stored
MIN_TRADE = Decimal("1")  # smallest trade, in the portfolio's currency
# Used only if no live rate is available; the response then says it's approximate.
FALLBACK_FX = {
    ("eur", "usd"): Decimal("1.10"),
    ("usd", "eur"): Decimal("0.91"),
    ("gbp", "eur"): Decimal("1.17"),
    ("gbp", "usd"): Decimal("1.30"),
}


class SimulationError(HTTPException):
    pass


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _today() -> date:
    return _utcnow().date()


def _money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_STEP, rounding=ROUND_HALF_UP)


def _aware(value: datetime) -> datetime:
    # SQLite returns naive datetimes; everything is stored in UTC.
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def to_record(t: SimTrade) -> TradeRecord:
    return TradeRecord(
        id=t.id,
        coin_id=t.coin_id,
        symbol=t.coin_symbol,
        name=t.coin_name,
        image=t.coin_image,
        side=t.side,  # type: ignore[arg-type]
        quantity=Decimal(t.quantity),
        price=Decimal(t.price),
        gross=Decimal(t.gross),
        fee=Decimal(t.fee),
        executed_at=_aware(t.executed_at),
        crypto_value_before=Decimal(t.crypto_value_before)
        if t.crypto_value_before is not None
        else None,
    )


def country_out(rule: TaxRule) -> CountryOut:
    return CountryOut(
        code=rule.code,  # type: ignore[arg-type]
        name=rule.name,
        default_currency=rule.default_currency,
        summary=rule.summary,
        notes=list(rule.notes),
        sources=[SourceOut(label=s.label, url=s.url) for s in rule.sources],
        verified_on=VERIFIED_ON,
    )


def list_countries() -> list[CountryOut]:
    return [country_out(rule) for rule in TAX_RULES.values()]


class SimulationService:
    def __init__(self, repo: SQLSimulationRepository, market: MarketService) -> None:
        self.repo = repo
        self.market = market

    # ---------- helpers ----------

    async def _portfolio(self, user_id: int, lock: bool = False) -> SimPortfolio:
        portfolio = await self.repo.get_portfolio(user_id, lock=lock)
        if portfolio is None:
            raise SimulationError(status.HTTP_404_NOT_FOUND, "Aucun portefeuille de simulation.")
        return portfolio

    async def _live_prices(self, currency: str, coin_ids: list[str]) -> dict[str, Decimal]:
        if not coin_ids:
            return {}
        try:
            prices = await self.market.get_prices(currency, coin_ids)
        except httpx.HTTPError:
            logger.warning("Live prices unavailable for %s", coin_ids)
            return {}
        return {coin: Decimal(str(price)) for coin, price in prices.items()}

    async def _fx(self, rule: TaxRule, currency: str) -> tuple[Decimal, bool]:
        """Value of one unit of the rule's currency in the portfolio's currency."""
        if rule.amounts_currency == currency:
            return Decimal("1"), False
        try:
            result = await self.market.get_exchange_rate(rule.amounts_currency, currency)
            if result and result.get("rate"):
                return Decimal(str(result["rate"])), False
        except httpx.HTTPError:
            logger.warning("Exchange rate unavailable: %s→%s", rule.amounts_currency, currency)
        return FALLBACK_FX[(rule.amounts_currency, currency)], True

    async def _state(self, portfolio: SimPortfolio) -> tuple[list[SimTrade], list[TradeRecord], ReplayResult]:
        rows = await self.repo.list_trades(portfolio.id)
        records = [to_record(r) for r in rows]
        return rows, records, replay(Decimal(portfolio.initial_capital), records)

    async def _valuation(self, portfolio: SimPortfolio, rows: list[SimTrade], state: ReplayResult):
        """Positions at live prices; the last trade price stands in when there is none."""
        live = await self._live_prices(portfolio.currency, list(state.positions))
        last_price = {r.coin_id: Decimal(r.price) for r in rows}  # rows are in time order
        priced = []
        for coin_id, position in state.positions.items():
            stale = coin_id not in live
            price = last_price.get(coin_id, ZERO) if stale else live[coin_id]
            priced.append((position, price, stale))
        holdings = sum((p.quantity * price for p, price, _ in priced), ZERO)
        return priced, holdings

    # ---------- portfolio ----------

    async def create(self, user_id: int, data: PortfolioCreate) -> PortfolioOut:
        if await self.repo.get_portfolio(user_id) is not None:
            raise SimulationError(status.HTTP_409_CONFLICT, "Tu as déjà un portefeuille de simulation.")
        await self.repo.add(
            SimPortfolio(
                user_id=user_id,
                currency=data.currency,
                initial_capital=data.initial_capital,
                country=data.country,
            )
        )
        await self.repo.commit()
        return await self.view(user_id)

    async def update_country(self, user_id: int, data: PortfolioUpdate) -> PortfolioOut:
        portfolio = await self._portfolio(user_id)
        portfolio.country = data.country
        await self.repo.commit()
        return await self.view(user_id)

    async def reset(self, user_id: int, data: PortfolioCreate) -> PortfolioOut:
        portfolio = await self._portfolio(user_id, lock=True)
        await self.repo.delete_history(portfolio.id)
        portfolio.initial_capital = data.initial_capital
        portfolio.currency = data.currency
        portfolio.country = data.country
        portfolio.created_at = _utcnow()
        await self.repo.commit()
        return await self.view(user_id)

    async def view(self, user_id: int) -> PortfolioOut:
        portfolio = await self._portfolio(user_id)
        rows, records, state = await self._state(portfolio)
        priced, holdings = await self._valuation(portfolio, rows, state)
        initial = Decimal(portfolio.initial_capital)
        total = state.cash + holdings

        await self.repo.upsert_snapshot(portfolio.id, _today(), _money(total), _money(state.cash))
        snapshots = await self.repo.list_snapshots(portfolio.id)

        rule = get_rule(portfolio.country)
        fx, fx_estimated = await self._fx(rule, portfolio.currency)
        tax = estimate_tax(rule, records, state, fx)
        unrealized = sum((p.quantity * price - p.cost for p, price, _ in priced), ZERO)
        total_pnl = total - initial
        risk = risk_stats([Decimal(s.total_value) for s in snapshots])
        stats = trade_stats(records, state)

        def sale_out(sale):
            if sale is None:
                return None
            return SaleOut(
                trade_id=sale.trade_id,
                symbol=sale.symbol,
                realized_pnl=float(sale.realized_pnl),
                executed_at=sale.executed_at,
            )

        return PortfolioOut(
            id=portfolio.id,
            currency=portfolio.currency,  # type: ignore[arg-type]
            country=portfolio.country,  # type: ignore[arg-type]
            initial_capital=float(initial),
            fee_rate=float(portfolio.fee_rate),
            created_at=_aware(portfolio.created_at),
            cash=float(state.cash),
            holdings_value=float(holdings),
            total_value=float(total),
            positions=[
                PositionOut(
                    coin_id=p.coin_id,
                    symbol=p.symbol,
                    name=p.name,
                    image=p.image,
                    quantity=float(p.quantity),
                    avg_cost=float(p.avg_cost),
                    cost=float(p.cost),
                    price=float(price),
                    price_stale=stale,
                    value=float(p.quantity * price),
                    pnl=float(p.quantity * price - p.cost),
                    pnl_percent=float((p.quantity * price / p.cost - 1) * 100) if p.cost > 0 else 0.0,
                    share=float(p.quantity * price / total * 100) if total > 0 else 0.0,
                )
                for p, price, stale in sorted(priced, key=lambda x: x[0].quantity * x[1], reverse=True)
            ],
            pnl=PnlOut(
                total=float(total_pnl),
                total_percent=float(total_pnl / initial * 100) if initial > 0 else 0.0,
                realized=float(state.realized_pnl),
                unrealized=float(unrealized),
                after_tax=float(total_pnl - tax.total_tax),
            ),
            tax=TaxOut(
                country=portfolio.country,  # type: ignore[arg-type]
                years=[
                    TaxYearOut(
                        year=y.year,
                        sales_total=float(y.sales_total),
                        net_gain=float(y.net_gain),
                        short_term_gain=float(y.short_term_gain),
                        long_term_gain=float(y.long_term_gain),
                        taxable_gain=float(y.taxable_gain),
                        exempt=y.exempt,
                        tax=float(y.tax),
                    )
                    for y in tax.years
                ],
                total=float(tax.total_tax),
                fx_estimated=fx_estimated,
            ),
            risk=RiskOut(
                max_drawdown=float(risk.max_drawdown) if risk.max_drawdown is not None else None,
                volatility=float(risk.volatility) if risk.volatility is not None else None,
                days=risk.days,
            ),
            stats=TradeStatsOut(
                trades_count=stats.trades_count,
                sells_count=stats.sells_count,
                win_rate=float(stats.win_rate) if stats.win_rate is not None else None,
                best_sale=sale_out(stats.best_sale),
                worst_sale=sale_out(stats.worst_sale),
                avg_holding_days=float(stats.avg_holding_days)
                if stats.avg_holding_days is not None
                else None,
                total_fees=float(stats.total_fees),
            ),
            history=[HistoryPoint(day=s.day, value=float(s.total_value)) for s in snapshots],
        )

    # ---------- trades ----------

    async def _coin(self, currency: str, coin_id: str) -> dict:
        try:
            coin = await self.market.get_market_by_id(currency, coin_id)
        except httpx.HTTPError:
            raise SimulationError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Prix indisponible pour le moment. Réessaie dans un instant.",
            )
        if coin is None:
            raise SimulationError(status.HTTP_404_NOT_FOUND, "Crypto introuvable.")
        if not coin.get("price") or coin["price"] <= 0:
            raise SimulationError(
                status.HTTP_503_SERVICE_UNAVAILABLE, "Aucun prix disponible pour cette crypto."
            )
        return coin

    async def place_trade(self, user_id: int, data: TradeCreate) -> TradeOut:
        portfolio = await self._portfolio(user_id, lock=True)
        rows, records, state = await self._state(portfolio)
        coin = await self._coin(portfolio.currency, data.coin_id)
        price = Decimal(str(coin["price"]))
        fee_rate = Decimal(portfolio.fee_rate)
        value_before = None

        if data.side == "buy":
            if data.amount is not None:
                gross_budget = data.amount / (1 + fee_rate)
                quantity = (gross_budget / price).quantize(QUANTITY_STEP, rounding=ROUND_DOWN)
            else:
                quantity = data.quantity.quantize(QUANTITY_STEP, rounding=ROUND_DOWN)
            gross = _money(quantity * price)
            fee = _money(gross * fee_rate)
            if quantity <= 0 or gross < MIN_TRADE:
                raise SimulationError(
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                    f"Montant trop petit : minimum {MIN_TRADE} par ordre.",
                )
            if gross + fee > state.cash:
                raise SimulationError(status.HTTP_409_CONFLICT, "Solde insuffisant pour cet achat.")
        else:
            position = state.positions.get(data.coin_id)
            if position is None:
                raise SimulationError(status.HTTP_409_CONFLICT, "Tu ne détiens pas cette crypto.")
            quantity = data.quantity
            if quantity > position.quantity:
                # Rounding on the client side: accept a hair more than held as "all".
                if quantity - position.quantity > QUANTITY_STEP * 10:
                    raise SimulationError(
                        status.HTTP_409_CONFLICT, "Quantité supérieure à ta position."
                    )
                quantity = position.quantity
            quantity = quantity.quantize(QUANTITY_STEP, rounding=ROUND_DOWN)
            gross = _money(quantity * price)
            fee = _money(gross * fee_rate)
            closes_position = quantity == position.quantity
            if quantity <= 0 or (gross < MIN_TRADE and not closes_position):
                raise SimulationError(
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                    f"Montant trop petit : minimum {MIN_TRADE} par ordre.",
                )
            # Value of every coin held just before the sale (France's formula).
            others = [c for c in state.positions if c != data.coin_id]
            live = await self._live_prices(portfolio.currency, others)
            last_price = {r.coin_id: Decimal(r.price) for r in rows}
            value_before = _money(
                position.quantity * price
                + sum(
                    (
                        p.quantity * live.get(c, last_price.get(c, ZERO))
                        for c, p in state.positions.items()
                        if c != data.coin_id
                    ),
                    ZERO,
                )
            )

        trade = SimTrade(
            portfolio_id=portfolio.id,
            coin_id=data.coin_id,
            coin_symbol=str(coin.get("symbol", data.coin_id)).upper()[:50],
            coin_name=str(coin.get("name", data.coin_id))[:200],
            coin_image=str(coin.get("image") or "")[:500],
            side=data.side,
            quantity=quantity,
            price=price.quantize(QUANTITY_STEP, rounding=ROUND_HALF_UP),
            gross=gross,
            fee=fee,
            crypto_value_before=value_before,
            executed_at=_utcnow(),
        )
        await self.repo.add(trade)
        await self.repo.commit()

        record = to_record(trade)
        after = replay(Decimal(portfolio.initial_capital), [*records, record])
        realized = next((s.realized_pnl for s in after.sales if s.trade_id == trade.id), None)
        taxable = None
        if data.side == "sell":
            rule = get_rule(portfolio.country)
            fx, _ = await self._fx(rule, portfolio.currency)
            taxable = estimate_tax(rule, [*records, record], after, fx).sale_gains.get(trade.id)

        try:
            await self.record_snapshot(portfolio)
        except Exception:
            logger.exception("Snapshot after trade failed")

        return _trade_out(record, realized, taxable)

    async def trades(self, user_id: int, limit: int, offset: int) -> TradesPage:
        portfolio = await self._portfolio(user_id)
        _, records, state = await self._state(portfolio)
        rule = get_rule(portfolio.country)
        fx, _ = await self._fx(rule, portfolio.currency)
        gains = estimate_tax(rule, records, state, fx).sale_gains
        realized = {s.trade_id: s.realized_pnl for s in state.sales}
        newest_first = sorted(records, key=lambda t: (t.executed_at, t.id), reverse=True)
        page = newest_first[offset : offset + limit]
        return TradesPage(
            items=[_trade_out(t, realized.get(t.id), gains.get(t.id)) for t in page],
            total=len(records),
        )

    async def quotes(self, user_id: int) -> QuotesOut:
        """Live prices of the coins held, for the real-time display.

        Read-only and light, so the page can call it every 30 seconds: no
        snapshot is written and no tax is computed (unlike `view`).
        """
        portfolio = await self._portfolio(user_id)
        _, _, state = await self._state(portfolio)
        held = list(state.positions)
        live = await self._live_prices(portfolio.currency, held)
        return QuotesOut(
            prices={coin: float(price) for coin, price in live.items() if coin in state.positions},
            stale=sorted(coin for coin in held if coin not in live),
            at=_utcnow(),
        )

    # ---------- snapshots ----------

    async def record_snapshot(self, portfolio: SimPortfolio) -> None:
        rows, _, state = await self._state(portfolio)
        _, holdings = await self._valuation(portfolio, rows, state)
        await self.repo.upsert_snapshot(
            portfolio.id, _today(), _money(state.cash + holdings), _money(state.cash)
        )

    async def snapshot_all(self) -> int:
        """Today's value of every portfolio (the background task calls this)."""
        portfolios = await self.repo.list_portfolios()
        done = 0
        for portfolio in portfolios:
            try:
                await self.record_snapshot(portfolio)
                done += 1
            except Exception:
                logger.exception("Snapshot failed for portfolio %s", portfolio.id)
        return done


def _trade_out(t: TradeRecord, realized: Decimal | None, taxable: Decimal | None) -> TradeOut:
    total = t.gross + t.fee if t.side == "buy" else t.gross - t.fee
    return TradeOut(
        id=t.id,
        coin_id=t.coin_id,
        symbol=t.symbol,
        name=t.name,
        image=t.image,
        side=t.side,
        quantity=float(t.quantity),
        price=float(t.price),
        gross=float(t.gross),
        fee=float(t.fee),
        total=float(total),
        realized_pnl=float(realized) if realized is not None else None,
        taxable_gain=float(taxable) if taxable is not None else None,
        executed_at=t.executed_at,
    )


async def snapshot_loop(session_factory, market_factory, interval_seconds: int) -> None:
    """Records every portfolio's daily value, every `interval_seconds`."""
    while True:
        try:
            async with session_factory() as session:
                service = SimulationService(SQLSimulationRepository(session), market_factory())
                count = await service.snapshot_all()
                logger.info("Simulation snapshots recorded: %s", count)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Simulation snapshot run failed")
        await asyncio.sleep(interval_seconds)
