"""Estimated tax on realized gains, per tax year. Pure functions, no I/O.

Each sale's gain is computed with the country's method (see tax_rules), then
gains are summed per tax year, where the exemption and rates apply. Losses
offset gains of the same year only (no carry-forward): it is an estimate.
"""

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal
from typing import Sequence

from app.services.simulation.engine import (
    ZERO,
    ReplayResult,
    TradeRecord,
    chronological,
    held_more_than_one_year,
    match_lots,
)
from app.services.simulation.tax_rules import TaxRule

CENT = Decimal("0.01")


@dataclass(frozen=True)
class SaleGain:
    trade_id: int
    executed_at: datetime
    gross: Decimal
    short_term: Decimal  # gain (or loss) on what was held one year or less
    long_term: Decimal  # gain (or loss) on what was held more than one year

    @property
    def total(self) -> Decimal:
        return self.short_term + self.long_term


@dataclass(frozen=True)
class YearTax:
    year: str  # "2026", or "2026-27" for the UK
    sales_total: Decimal
    net_gain: Decimal
    short_term_gain: Decimal
    long_term_gain: Decimal
    taxable_gain: Decimal
    exempt: bool  # the year's exemption removed all of the tax
    tax: Decimal


@dataclass(frozen=True)
class TaxEstimate:
    country: str
    years: tuple[YearTax, ...]
    sale_gains: dict[int, Decimal]  # gain per sale for the country's method

    @property
    def total_tax(self) -> Decimal:
        return sum((y.tax for y in self.years), ZERO)


def tax_year_label(when: datetime, rule: TaxRule) -> str:
    month, day = rule.tax_year_start
    if (month, day) == (1, 1):
        return str(when.year)
    start = when.year if (when.month, when.day) >= (month, day) else when.year - 1
    return f"{start}-{str(start + 1)[-2:]}"


def _gains_with_lots(trades: Sequence[TradeRecord], replay: ReplayResult, method: str) -> list[SaleGain]:
    matches = match_lots(trades, method)  # type: ignore[arg-type]
    gains = []
    for sale in replay.sales:
        short = long = ZERO
        for lot in matches.get(sale.trade_id, []):
            share = lot.quantity / sale.quantity if sale.quantity > 0 else ZERO
            gain = sale.proceeds * share - lot.quantity * lot.unit_cost
            if held_more_than_one_year(lot.acquired_at, sale.executed_at):
                long += gain
            else:
                short += gain
        gains.append(SaleGain(sale.trade_id, sale.executed_at, sale.gross, short, long))
    return gains


def _gains_france(trades: Sequence[TradeRecord]) -> list[SaleGain]:
    """Art. 150 VH bis CGI (form 2086):

    gain = net sale price − total acquisition cost × (sale price / portfolio value)

    The total acquisition cost covers every purchase (fees included) and is
    reduced after each sale by the share of it that the sale used up.
    """
    total_cost = ZERO
    gains = []
    for t in chronological(trades):
        if t.side == "buy":
            total_cost += t.gross + t.fee
            continue
        portfolio_value = t.crypto_value_before
        if portfolio_value is None or portfolio_value < t.gross:
            portfolio_value = t.gross  # never use more than the whole cost
        used_cost = total_cost * t.gross / portfolio_value if portfolio_value > 0 else ZERO
        gain = (t.gross - t.fee) - used_cost
        total_cost -= used_cost
        gains.append(SaleGain(t.id, t.executed_at, t.gross, gain, ZERO))
    return gains


def _sale_gains(rule: TaxRule, trades: Sequence[TradeRecord], replay: ReplayResult) -> list[SaleGain]:
    if rule.method == "france_global":
        return _gains_france(trades)
    if rule.method in ("fifo", "lifo"):
        return _gains_with_lots(trades, replay, rule.method)
    # "average" (UK pool) and "none": gain on the average cost basis.
    return [
        SaleGain(s.trade_id, s.executed_at, s.gross, s.realized_pnl, ZERO) for s in replay.sales
    ]


def _progressive(base: Decimal, brackets, fx: Decimal) -> Decimal:
    tax = ZERO
    lower = ZERO
    for upper, rate in brackets:
        upper_value = upper * fx if upper is not None else None
        if upper_value is None or base <= upper_value:
            tax += (base - lower) * rate
            return tax
        tax += (upper_value - lower) * rate
        lower = upper_value
    return tax


def _net_buckets(short: Decimal, long: Decimal, long_rate: Decimal) -> tuple[Decimal, Decimal]:
    """Taxable short- and long-term gains, after losses offset gains."""
    if long_rate == 0:
        # Long-term disposals are outside the tax (Germany): only the
        # short-term result counts, and long-term losses don't offset it.
        return max(short, ZERO), ZERO
    # US-style netting: a net loss in one bucket reduces the other.
    if short < 0 < long:
        return ZERO, max(long + short, ZERO)
    if long < 0 < short:
        return max(short + long, ZERO), ZERO
    return max(short, ZERO), max(long, ZERO)


def _split_rate_tax(
    rule: TaxRule, short: Decimal, long: Decimal, fx: Decimal
) -> tuple[Decimal, Decimal, bool]:
    """Taxable gain, tax and exemption flag when short and long term have their own rates."""
    long_rate = rule.long_term_rate or ZERO
    taxable_short, taxable_long = _net_buckets(short, long, long_rate)
    exemption = rule.exemption
    exempt = False
    if (
        exemption
        and exemption.kind == "short_term_free_limit"
        and 0 < taxable_short < exemption.amount * fx
    ):
        taxable_short = ZERO
        exempt = True
    tax = taxable_short * rule.short_term_rate + taxable_long * long_rate
    return taxable_short + taxable_long, tax, exempt


def _single_rate_tax(
    rule: TaxRule, net: Decimal, sales_total: Decimal, fx: Decimal
) -> tuple[Decimal, Decimal, bool]:
    """Taxable gain, tax and exemption flag when every gain is taxed the same way."""
    taxable = max(net, ZERO)
    exemption = rule.exemption
    exempt = False
    if exemption and taxable > 0:
        limit = exemption.amount * fx
        if exemption.kind == "sales_total_max" and sales_total <= limit:
            taxable, exempt = ZERO, True
        elif exemption.kind == "allowance":
            exempt = taxable <= limit
            taxable = max(taxable - limit, ZERO)
    if rule.brackets:
        tax = _progressive(taxable, rule.brackets, fx)
    else:
        tax = taxable * (rule.flat_rate or ZERO)
    return taxable, tax, exempt


def _year_tax(rule: TaxRule, year: str, gains: list[SaleGain], fx: Decimal) -> YearTax:
    sales_total = sum((g.gross for g in gains), ZERO)
    short = sum((g.short_term for g in gains), ZERO)
    long = sum((g.long_term for g in gains), ZERO)
    net = short + long

    if rule.short_term_rate is not None:
        taxable, tax, exempt = _split_rate_tax(rule, short, long, fx)
    else:
        taxable, tax, exempt = _single_rate_tax(rule, net, sales_total, fx)

    return YearTax(
        year=year,
        sales_total=sales_total,
        net_gain=net,
        short_term_gain=short,
        long_term_gain=long,
        taxable_gain=taxable,
        exempt=exempt,
        tax=tax.quantize(CENT, rounding=ROUND_HALF_UP),
    )


def estimate_tax(
    rule: TaxRule,
    trades: Sequence[TradeRecord],
    replay: ReplayResult,
    fx: Decimal = Decimal("1"),
) -> TaxEstimate:
    """`fx`: value of one unit of `rule.amounts_currency` in the portfolio's currency."""
    gains = _sale_gains(rule, trades, replay)
    by_year: dict[str, list[SaleGain]] = defaultdict(list)
    for g in gains:
        by_year[tax_year_label(g.executed_at, rule)].append(g)

    years = tuple(_year_tax(rule, year, by_year[year], fx) for year in sorted(by_year))
    return TaxEstimate(
        country=rule.code,
        years=years,
        sale_gains={g.trade_id: g.total for g in gains},
    )
