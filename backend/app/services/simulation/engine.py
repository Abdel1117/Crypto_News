"""Replays a portfolio's trades to rebuild its state. Pure functions, no I/O.

Trades are the only stored history: cash, positions, average costs, lots and
realized PnL are always recomputed from them, so a country change or a fix to a
rule applies to the whole history consistently.

Fees: a buy costs `gross + fee` (the fee is part of the cost basis); a sell
brings `gross - fee`.
"""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Iterable, Literal, Sequence

ZERO = Decimal("0")


@dataclass(frozen=True)
class TradeRecord:
    id: int
    coin_id: str
    symbol: str
    name: str
    image: str
    side: Literal["buy", "sell"]
    quantity: Decimal
    price: Decimal
    gross: Decimal
    fee: Decimal
    executed_at: datetime
    crypto_value_before: Decimal | None = None


@dataclass
class Position:
    coin_id: str
    symbol: str
    name: str
    image: str
    quantity: Decimal = ZERO
    cost: Decimal = ZERO  # cost basis of the quantity held, fees included

    @property
    def avg_cost(self) -> Decimal:
        return self.cost / self.quantity if self.quantity > 0 else ZERO


@dataclass(frozen=True)
class Sale:
    trade_id: int
    coin_id: str
    symbol: str
    executed_at: datetime
    quantity: Decimal
    gross: Decimal
    fee: Decimal
    proceeds: Decimal  # gross - fee
    cost_basis: Decimal  # average cost of the quantity sold
    realized_pnl: Decimal  # proceeds - cost_basis
    crypto_value_before: Decimal | None


@dataclass
class ReplayResult:
    cash: Decimal
    positions: dict[str, Position]
    sales: list[Sale] = field(default_factory=list)
    total_fees: Decimal = ZERO

    @property
    def realized_pnl(self) -> Decimal:
        return sum((s.realized_pnl for s in self.sales), ZERO)


@dataclass(frozen=True)
class MatchedLot:
    """The part of an earlier purchase that a sale consumed."""

    quantity: Decimal
    unit_cost: Decimal  # per unit, buy fee included
    acquired_at: datetime


def chronological(trades: Iterable[TradeRecord]) -> list[TradeRecord]:
    return sorted(trades, key=lambda t: (t.executed_at, t.id))


def replay(initial_capital: Decimal, trades: Sequence[TradeRecord]) -> ReplayResult:
    """Cash, positions (average cost) and realized PnL after all `trades`."""
    cash = initial_capital
    positions: dict[str, Position] = {}
    sales: list[Sale] = []
    total_fees = ZERO

    for t in chronological(trades):
        total_fees += t.fee
        pos = positions.get(t.coin_id)
        if pos is None:
            pos = positions[t.coin_id] = Position(t.coin_id, t.symbol, t.name, t.image)
        if t.side == "buy":
            cost = t.gross + t.fee
            cash -= cost
            pos.quantity += t.quantity
            pos.cost += cost
        else:
            quantity = min(t.quantity, pos.quantity)
            basis = pos.cost * quantity / pos.quantity if pos.quantity > 0 else ZERO
            pos.quantity -= quantity
            pos.cost = pos.cost - basis if pos.quantity > 0 else ZERO
            proceeds = t.gross - t.fee
            cash += proceeds
            sales.append(
                Sale(
                    trade_id=t.id,
                    coin_id=t.coin_id,
                    symbol=t.symbol,
                    executed_at=t.executed_at,
                    quantity=t.quantity,
                    gross=t.gross,
                    fee=t.fee,
                    proceeds=proceeds,
                    cost_basis=basis,
                    realized_pnl=proceeds - basis,
                    crypto_value_before=t.crypto_value_before,
                )
            )

    open_positions = {k: p for k, p in positions.items() if p.quantity > 0}
    return ReplayResult(cash=cash, positions=open_positions, sales=sales, total_fees=total_fees)


def match_lots(
    trades: Sequence[TradeRecord], method: Literal["fifo", "lifo"]
) -> dict[int, list[MatchedLot]]:
    """For each sale (by trade id), the purchase lots it consumed.

    FIFO sells the oldest lots first, LIFO the newest.
    """
    lots: dict[str, list[MatchedLot]] = {}
    matches: dict[int, list[MatchedLot]] = {}

    for t in chronological(trades):
        coin_lots = lots.setdefault(t.coin_id, [])
        if t.side == "buy":
            if t.quantity > 0:
                unit_cost = (t.gross + t.fee) / t.quantity
                coin_lots.append(MatchedLot(t.quantity, unit_cost, t.executed_at))
            continue

        remaining = t.quantity
        consumed: list[MatchedLot] = []
        while remaining > 0 and coin_lots:
            index = 0 if method == "fifo" else len(coin_lots) - 1
            lot = coin_lots[index]
            take = min(remaining, lot.quantity)
            consumed.append(MatchedLot(take, lot.unit_cost, lot.acquired_at))
            remaining -= take
            left = lot.quantity - take
            if left > 0:
                coin_lots[index] = MatchedLot(left, lot.unit_cost, lot.acquired_at)
            else:
                coin_lots.pop(index)
        matches[t.id] = consumed

    return matches


def held_more_than_one_year(acquired_at: datetime, sold_at: datetime) -> bool:
    """True when the sale happens after the first anniversary of the purchase."""
    try:
        anniversary = acquired_at.replace(year=acquired_at.year + 1)
    except ValueError:  # bought on 29 February
        anniversary = acquired_at.replace(year=acquired_at.year + 1, day=28)
    return sold_at > anniversary
