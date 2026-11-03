"""Performance statistics of a simulated portfolio. Pure functions, no I/O."""

import math
import statistics
from dataclasses import dataclass
from decimal import Decimal
from typing import Sequence

from app.services.simulation.engine import ZERO, ReplayResult, Sale, TradeRecord, match_lots

SECONDS_PER_DAY = Decimal(86400)


@dataclass(frozen=True)
class RiskStats:
    # Worst drop from a previous peak, as a fraction (0.25 = −25 %).
    max_drawdown: Decimal | None
    # Annualized standard deviation of daily returns, as a fraction.
    volatility: Decimal | None
    days: int


@dataclass(frozen=True)
class TradeStats:
    trades_count: int
    sells_count: int
    win_rate: Decimal | None  # share of sells with a positive realized PnL
    best_sale: Sale | None
    worst_sale: Sale | None
    avg_holding_days: Decimal | None  # FIFO, weighted by quantity
    total_fees: Decimal


def risk_stats(values: Sequence[Decimal]) -> RiskStats:
    """`values`: one portfolio value per day, oldest first."""
    if len(values) < 2:
        return RiskStats(max_drawdown=None, volatility=None, days=len(values))

    peak = values[0]
    worst = ZERO
    for v in values:
        peak = max(peak, v)
        if peak > 0:
            worst = max(worst, (peak - v) / peak)

    returns = [
        float(b / a - 1) for a, b in zip(values, values[1:]) if a > 0
    ]
    volatility = None
    if len(returns) >= 2:
        volatility = Decimal(str(statistics.stdev(returns) * math.sqrt(365)))

    return RiskStats(max_drawdown=worst, volatility=volatility, days=len(values))


def trade_stats(trades: Sequence[TradeRecord], replay: ReplayResult) -> TradeStats:
    sales = replay.sales
    win_rate = None
    best = worst = None
    if sales:
        wins = sum(1 for s in sales if s.realized_pnl > 0)
        win_rate = Decimal(wins) / Decimal(len(sales))
        best = max(sales, key=lambda s: s.realized_pnl)
        worst = min(sales, key=lambda s: s.realized_pnl)

    matches = match_lots(trades, "fifo")
    weighted = ZERO
    quantity = ZERO
    for sale in sales:
        for lot in matches.get(sale.trade_id, []):
            held = Decimal(str((sale.executed_at - lot.acquired_at).total_seconds()))
            weighted += lot.quantity * held / SECONDS_PER_DAY
            quantity += lot.quantity
    avg_holding = weighted / quantity if quantity > 0 else None

    return TradeStats(
        trades_count=len(trades),
        sells_count=len(sales),
        win_rate=win_rate,
        best_sale=best,
        worst_sale=worst,
        avg_holding_days=avg_holding,
        total_fees=replay.total_fees,
    )
