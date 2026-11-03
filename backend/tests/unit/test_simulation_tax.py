from decimal import Decimal

import pytest

from app.services.simulation.engine import replay
from app.services.simulation.tax import estimate_tax, tax_year_label
from app.services.simulation.tax_rules import SUPPORTED_COUNTRIES, TAX_RULES, get_rule
from tests.unit.simulation_helpers import D, at, trade

CAPITAL = D("100000")


def tax_for(country, trades, fx="1"):
    return estimate_tax(get_rule(country), trades, replay(CAPITAL, trades), D(fx))


def one_year(estimate):
    assert len(estimate.years) == 1
    return estimate.years[0]


class TestRules:
    def test_all_eight_countries_are_supported(self):
        assert set(SUPPORTED_COUNTRIES) == {"FR", "BE", "CH", "DE", "ES", "IT", "GB", "US"}

    @pytest.mark.parametrize("code", list(TAX_RULES))
    def test_every_rule_has_a_summary_and_an_official_source(self, code):
        rule = TAX_RULES[code]
        assert rule.summary
        assert rule.sources
        assert all(s.url.startswith("https://") for s in rule.sources)

    def test_only_the_us_defaults_to_dollars(self):
        defaults = {code: r.default_currency for code, r in TAX_RULES.items()}
        assert defaults.pop("US") == "usd"
        assert set(defaults.values()) == {"eur"}


class TestFrance:
    def test_global_formula_over_two_sales(self):
        trades = [
            trade("buy", 1, 1000, at(2026, 1, 1)),
            # BTC doubled: the whole portfolio is worth 2000 before the sale.
            trade("sell", "0.25", 2000, at(2026, 6, 1), value_before=2000),
            # 0.75 BTC left, worth 1500; remaining acquisition cost 750.
            trade("sell", "0.15", 2000, at(2026, 7, 1), value_before=1500),
        ]
        estimate = tax_for("FR", trades)

        # Sale 1: 500 − 1000 × 500/2000 = 250. Sale 2: 300 − 750 × 300/1500 = 150.
        assert estimate.sale_gains == {trades[1].id: D("250"), trades[2].id: D("150")}
        year = one_year(estimate)
        assert year.net_gain == D("400")
        assert year.tax == D("125.60")  # 31.4 %

    def test_sale_fee_reduces_the_gain(self):
        trades = [
            trade("buy", 1, 1000, at(2026, 1, 1)),
            trade("sell", "0.25", 2000, at(2026, 6, 1), fee=10, value_before=2000),
        ]
        assert tax_for("FR", trades).sale_gains[trades[1].id] == D("240")

    def test_year_is_exempt_when_sales_stay_under_305(self):
        trades = [
            trade("buy", 1, 100, at(2026, 1, 1)),
            trade("sell", 1, 300, at(2026, 6, 1), value_before=300),
        ]
        year = one_year(tax_for("FR", trades))
        assert year.net_gain == D("200")
        assert year.exempt
        assert year.tax == D("0.00")

    def test_gain_depends_on_the_whole_portfolio_not_the_coin_sold(self):
        trades = [
            trade("buy", 1, 1000, at(2026, 1, 1), coin="bitcoin"),
            trade("buy", 1, 1000, at(2026, 1, 1), coin="ethereum"),
            # ETH halved (500) but BTC doubled (2000): the portfolio is worth 2500.
            trade("sell", 1, 500, at(2026, 6, 1), coin="ethereum", value_before=2500),
        ]
        # 500 − 2000 × 500/2500 = +100, even though ETH alone lost 500.
        assert tax_for("FR", trades).sale_gains[trades[2].id] == D("100")

    def test_losses_offset_gains_of_the_same_year_only(self):
        trades = [
            trade("buy", 1, 1000, at(2026, 1, 1), coin="bitcoin"),
            trade("buy", 1, 1000, at(2026, 1, 1), coin="ethereum"),
            # The whole portfolio is underwater: 1100 for 2000 invested.
            trade("sell", 1, 500, at(2026, 6, 1), coin="ethereum", value_before=1100),
            trade("sell", 1, 3000, at(2027, 6, 1), coin="bitcoin", value_before=3000),
        ]
        estimate = tax_for("FR", trades)
        assert [y.year for y in estimate.years] == ["2026", "2027"]
        assert estimate.years[0].net_gain < 0
        assert estimate.years[0].tax == D("0.00")  # a loss year
        assert estimate.years[1].tax > 0  # not reduced by the 2026 loss


class TestBelgium:
    def test_10_percent_above_the_allowance(self):
        trades = [trade("buy", 1, 10000, at(2026, 1, 1)), trade("sell", 1, 22000, at(2026, 6, 1))]
        year = one_year(tax_for("BE", trades))
        assert year.taxable_gain == D("2000")
        assert year.tax == D("200.00")

    def test_gain_under_the_allowance_is_exempt(self):
        trades = [trade("buy", 1, 10000, at(2026, 1, 1)), trade("sell", 1, 18000, at(2026, 6, 1))]
        year = one_year(tax_for("BE", trades))
        assert year.exempt
        assert year.tax == D("0.00")


class TestSwitzerland:
    def test_no_tax(self):
        trades = [trade("buy", 1, 1000, at(2026, 1, 1)), trade("sell", 1, 50000, at(2026, 6, 1))]
        assert tax_for("CH", trades).total_tax == 0


class TestGermany:
    def test_short_term_gain_under_1000_is_free(self):
        trades = [trade("buy", 1, 1000, at(2026, 1, 1)), trade("sell", 1, 1999, at(2026, 6, 1))]
        year = one_year(tax_for("DE", trades))
        assert year.exempt
        assert year.tax == D("0.00")

    def test_at_1000_the_whole_gain_is_taxed(self):
        trades = [trade("buy", 1, 1000, at(2026, 1, 1)), trade("sell", 1, 2000, at(2026, 6, 1))]
        assert one_year(tax_for("DE", trades)).tax == D("300.00")

    def test_held_more_than_a_year_is_tax_free(self):
        trades = [trade("buy", 1, 1000, at(2026, 1, 1)), trade("sell", 1, 9000, at(2027, 1, 2))]
        year = one_year(tax_for("DE", trades))
        assert year.long_term_gain == D("8000")
        assert year.tax == D("0.00")

    def test_long_term_losses_do_not_offset_short_term_gains(self):
        trades = [
            trade("buy", 1, 3000, at(2026, 1, 1), coin="ethereum"),
            trade("buy", 1, 1000, at(2027, 1, 10), coin="bitcoin"),
            trade("sell", 1, 1500, at(2027, 1, 20), coin="ethereum"),  # −1500, long term
            trade("sell", 1, 3000, at(2027, 2, 1), coin="bitcoin"),  # +2000, short term
        ]
        assert one_year(tax_for("DE", trades)).tax == D("600.00")


class TestSpain:
    def test_progressive_brackets(self):
        trades = [trade("buy", 1, 1000, at(2026, 1, 1)), trade("sell", 1, 11000, at(2026, 6, 1))]
        # 6 000 × 19 % + 4 000 × 21 %
        assert one_year(tax_for("ES", trades)).tax == D("1980.00")

    def test_brackets_scale_to_a_dollar_portfolio(self):
        trades = [trade("buy", 1, 1000, at(2026, 1, 1)), trade("sell", 1, 12000, at(2026, 6, 1))]
        # 1 € = 1.1 $: first bracket ends at 6 600 $.  6 600 × 19 % + 4 400 × 21 %
        assert one_year(tax_for("ES", trades, fx="1.1")).tax == D("2178.00")


class TestItaly:
    def test_lifo_and_33_percent(self):
        trades = [
            trade("buy", 1, 100, at(2026, 1, 1)),
            trade("buy", 1, 300, at(2026, 2, 1)),
            trade("sell", 1, 400, at(2026, 3, 1)),
        ]
        year = one_year(tax_for("IT", trades))
        assert year.net_gain == D("100")  # LIFO: sold the 300 lot
        assert year.tax == D("33.00")


class TestUnitedKingdom:
    def test_allowance_in_pounds_is_converted(self):
        trades = [trade("buy", 1, 1000, at(2026, 5, 1)), trade("sell", 1, 6000, at(2026, 6, 1))]
        # 1 £ = 1.15 €: allowance 3 450 €.  (5 000 − 3 450) × 18 %
        assert one_year(tax_for("GB", trades, fx="1.15")).tax == D("279.00")

    def test_tax_year_starts_on_6_april(self):
        rule = get_rule("GB")
        assert tax_year_label(at(2026, 4, 5), rule) == "2025-26"
        assert tax_year_label(at(2026, 4, 6), rule) == "2026-27"


class TestUnitedStates:
    def test_short_and_long_term_rates(self):
        trades = [
            trade("buy", 1, 1000, at(2026, 1, 1), coin="bitcoin"),
            trade("buy", 1, 1000, at(2027, 1, 10), coin="ethereum"),
            trade("sell", 1, 2000, at(2027, 2, 1), coin="bitcoin"),  # +1000 long term
            trade("sell", 1, 2000, at(2027, 2, 1), coin="ethereum"),  # +1000 short term
        ]
        year = one_year(tax_for("US", trades))
        assert year.tax == D("370.00")  # 1000 × 15 % + 1000 × 22 %

    def test_short_term_loss_reduces_long_term_gain(self):
        trades = [
            trade("buy", 1, 1000, at(2026, 1, 1), coin="bitcoin"),
            trade("buy", 1, 1000, at(2027, 1, 10), coin="ethereum"),
            trade("sell", 1, 2000, at(2027, 2, 1), coin="bitcoin"),  # +1000 long term
            trade("sell", 1, 500, at(2027, 2, 1), coin="ethereum"),  # −500 short term
        ]
        assert one_year(tax_for("US", trades)).tax == D("75.00")  # 500 × 15 %


def test_no_sales_no_tax():
    trades = [trade("buy", 1, 1000, at(2026, 1, 1))]
    estimate = tax_for("FR", trades)
    assert estimate.years == ()
    assert estimate.total_tax == Decimal("0")
