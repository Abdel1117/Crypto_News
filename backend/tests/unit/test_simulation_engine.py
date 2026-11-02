from decimal import Decimal

from app.services.simulation.engine import held_more_than_one_year, match_lots, replay
from app.services.simulation.metrics import risk_stats, trade_stats
from tests.unit.simulation_helpers import D, at, trade


class TestReplay:
    def test_buy_and_sell_with_fees(self):
        trades = [
            trade("buy", 1, 1000, at(2026, 1, 1), fee=1),
            trade("sell", "0.5", 2000, at(2026, 1, 2), fee=1),
        ]
        result = replay(D("10000"), trades)

        # Buy: 1000 + 1 fee. Sell: 1000 − 1 fee.
        assert result.cash == D("9998")
        position = result.positions["bitcoin"]
        assert position.quantity == D("0.5")
        assert position.cost == D("500.5")  # half of the cost, buy fee included
        sale = result.sales[0]
        assert sale.proceeds == D("999")
        assert sale.cost_basis == D("500.5")
        assert sale.realized_pnl == D("498.5")
        assert result.total_fees == D("2")

    def test_average_cost_across_buys(self):
        trades = [
            trade("buy", 1, 100, at(2026, 1, 1)),
            trade("buy", 1, 300, at(2026, 1, 2)),
        ]
        assert replay(D("1000"), trades).positions["bitcoin"].avg_cost == D("200")

    def test_closed_position_disappears_and_can_reopen(self):
        trades = [
            trade("buy", 1, 100, at(2026, 1, 1)),
            trade("sell", 1, 150, at(2026, 1, 2)),
        ]
        result = replay(D("1000"), trades)
        assert result.positions == {}
        assert result.cash == D("1050")

        trades.append(trade("buy", 2, 120, at(2026, 1, 3)))
        assert replay(D("1000"), trades).positions["bitcoin"].avg_cost == D("120")

    def test_trades_are_replayed_in_time_order(self):
        trades = [
            trade("sell", 1, 150, at(2026, 1, 2)),
            trade("buy", 1, 100, at(2026, 1, 1)),
        ]
        assert replay(D("1000"), trades).sales[0].realized_pnl == D("50")


class TestMatchLots:
    def setup_method(self):
        self.trades = [
            trade("buy", 1, 100, at(2026, 1, 1), trade_id=1),
            trade("buy", 1, 200, at(2026, 2, 1), trade_id=2),
            trade("sell", "1.5", 300, at(2026, 3, 1), trade_id=3),
        ]

    def test_fifo_uses_oldest_lots_first(self):
        lots = match_lots(self.trades, "fifo")[3]
        assert [(l.quantity, l.unit_cost) for l in lots] == [(D("1"), D("100")), (D("0.5"), D("200"))]

    def test_lifo_uses_newest_lots_first(self):
        lots = match_lots(self.trades, "lifo")[3]
        assert [(l.quantity, l.unit_cost) for l in lots] == [(D("1"), D("200")), (D("0.5"), D("100"))]

    def test_lot_cost_includes_buy_fee(self):
        trades = [
            trade("buy", 2, 100, at(2026, 1, 1), fee=2, trade_id=10),
            trade("sell", 1, 100, at(2026, 1, 2), trade_id=11),
        ]
        assert match_lots(trades, "fifo")[11][0].unit_cost == D("101")


class TestHoldingPeriod:
    def test_exactly_one_year_is_not_more_than_one_year(self):
        assert not held_more_than_one_year(at(2026, 3, 1), at(2027, 3, 1))

    def test_one_day_after_the_anniversary(self):
        assert held_more_than_one_year(at(2026, 3, 1), at(2027, 3, 2))

    def test_bought_on_29_february(self):
        assert held_more_than_one_year(at(2028, 2, 29), at(2029, 3, 1))


class TestRiskStats:
    def test_max_drawdown_from_peak(self):
        stats = risk_stats([D("100"), D("120"), D("90"), D("130")])
        assert stats.max_drawdown == D("0.25")

    def test_needs_two_days(self):
        stats = risk_stats([D("100")])
        assert stats.max_drawdown is None
        assert stats.volatility is None

    def test_volatility_is_zero_for_a_steady_growth(self):
        stats = risk_stats([D("100"), D("101"), D("102.01"), D("103.0301")])
        assert stats.volatility is not None
        assert stats.volatility < Decimal("0.0000001")

    def test_volatility_is_positive_when_values_swing(self):
        stats = risk_stats([D("100"), D("110"), D("95"), D("105")])
        assert stats.volatility > 0


class TestTradeStats:
    def test_win_rate_best_worst_and_holding_time(self):
        trades = [
            trade("buy", 2, 100, at(2026, 1, 1), trade_id=1),
            trade("sell", 1, 150, at(2026, 1, 11), trade_id=2),  # +50 after 10 days
            trade("sell", 1, 80, at(2026, 1, 21), trade_id=3),  # −20 after 20 days
        ]
        stats = trade_stats(trades, replay(D("1000"), trades))

        assert stats.trades_count == 3
        assert stats.sells_count == 2
        assert stats.win_rate == D("0.5")
        assert stats.best_sale.realized_pnl == D("50")
        assert stats.worst_sale.realized_pnl == D("-20")
        assert stats.avg_holding_days == D("15")

    def test_no_sells(self):
        trades = [trade("buy", 1, 100, at(2026, 1, 1))]
        stats = trade_stats(trades, replay(D("1000"), trades))
        assert stats.win_rate is None
        assert stats.avg_holding_days is None
