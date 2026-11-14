import asyncio
from decimal import Decimal
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.auth.email_tokens import PURPOSE_CONFIRM_EMAIL, PURPOSE_STOP_ALERTS, create_email_token
from app.core.config import settings
from app.models.price_alert import PriceAlert
from app.models.user import User
from app.repositories.alerts.price_alert_sql_repo import SQLPriceAlertRepository
from app.schemas.alerts import AlertCreate
from app.services.alerts.price_alert_service import (
    MAX_ALERTS_PER_USER,
    PriceAlertService,
    is_reached,
    price_alert_loop,
)
from app.utils.dates import utcnow

from tests.unit.alert_helpers import FakeMarket, FakeSender


@pytest.fixture
async def engine():
    engine = create_async_engine("sqlite+aiosqlite://")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def session(engine):
    async with AsyncSession(engine, expire_on_commit=False) as s:
        yield s


async def make_user(session, email="user@example.com", verified=True, active=True) -> User:
    user = User(
        full_name="Test",
        email=email,
        is_active=active,
        email_verified_at=utcnow() if verified else None,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest.fixture
async def user(session):
    return await make_user(session)


@pytest.fixture
def sender():
    return FakeSender()


@pytest.fixture
def market():
    return FakeMarket()


@pytest.fixture
def service(session, market, sender):
    return PriceAlertService(SQLPriceAlertRepository(session), market, sender)


def request(threshold="50000", direction="below", currency="eur", coin="bitcoin") -> AlertCreate:
    return AlertCreate(coin_id=coin, currency=currency, direction=direction, threshold=Decimal(threshold))


async def stored_alert(session, user, **overrides) -> PriceAlert:
    """An alert written directly: the check tests start from any state this way."""
    values = dict(
        user_id=user.id,
        coin_id="bitcoin",
        coin_symbol="BTC",
        coin_name="Bitcoin",
        currency="eur",
        direction="below",
        threshold=Decimal("50000"),
    )
    values.update(overrides)
    alert = PriceAlert(**values)
    session.add(alert)
    await session.commit()
    await session.refresh(alert)
    return alert


async def reload(session, alert) -> PriceAlert:
    await session.refresh(alert)
    return alert


def set_price(market, value, coin="bitcoin", currency="eur"):
    market.prices.setdefault(coin, {})[currency] = value


class TestIsReached:
    @pytest.mark.parametrize(
        "direction,threshold,price,expected",
        [
            ("below", "50000", "49999.99", True),
            ("below", "50000", "50000", True),
            ("below", "50000", "50000.01", False),
            ("above", "85000", "85000.01", True),
            ("above", "85000", "85000", True),
            ("above", "85000", "84999.99", False),
        ],
    )
    def test_threshold_counts_as_reached(self, direction, threshold, price, expected):
        assert is_reached(direction, Decimal(threshold), Decimal(price)) is expected


class TestCreate:
    async def test_stores_the_alert_with_the_servers_coin_details(self, service, session, user):
        out = await service.create(user, request())

        assert out.symbol == "BIT"  # from the market data, not from the client
        assert out.name == "Bitcoin"
        assert out.threshold == 50000
        assert out.is_active is True
        assert out.triggered_at is None
        assert out.created_at.tzinfo is not None
        assert await SQLPriceAlertRepository(session).count_for_user(user.id) == 1

    async def test_both_of_the_usual_alerts_can_coexist(self, service, user):
        await service.create(user, request("50000", "below"))
        await service.create(user, request("85000", "above"))
        overview = await service.overview(user)
        assert {a.direction for a in overview.items} == {"below", "above"}

    async def test_refuses_an_unconfirmed_address(self, service, session, market):
        unconfirmed = await make_user(session, "new@example.com", verified=False)
        with pytest.raises(HTTPException) as exc:
            await service.create(unconfirmed, request())
        assert exc.value.status_code == 403
        assert market.coin_calls == 0

    async def test_explains_when_alerts_cant_be_delivered(self, session, market, user):
        service = PriceAlertService(SQLPriceAlertRepository(session), market, None)
        with pytest.raises(HTTPException) as exc:
            await service.create(user, request())
        assert exc.value.status_code == 503

    async def test_refuses_an_unknown_coin(self, service, user):
        with pytest.raises(HTTPException) as exc:
            await service.create(user, request(coin="not-a-coin"))
        assert exc.value.status_code == 404

    async def test_says_so_when_the_market_is_down(self, service, market, user):
        market.fail = True
        with pytest.raises(HTTPException) as exc:
            await service.create(user, request())
        assert exc.value.status_code == 503

    async def test_refuses_a_coin_without_a_price(self, service, market, user):
        set_price(market, None)
        with pytest.raises(HTTPException) as exc:
            await service.create(user, request())
        assert exc.value.status_code == 503

    @pytest.mark.parametrize(
        "threshold,direction",
        [("70000", "below"), ("60000", "below"), ("50000", "above"), ("60000", "above")],
    )
    async def test_refuses_a_threshold_already_reached(self, service, session, user, threshold, direction):
        # The fake price is 60000.
        with pytest.raises(HTTPException) as exc:
            await service.create(user, request(threshold, direction))
        assert exc.value.status_code == 409
        assert "60" in exc.value.detail
        assert await SQLPriceAlertRepository(session).count_for_user(user.id) == 0

    async def test_checks_the_threshold_in_the_alerts_currency(self, service, user):
        # 62000 is above the EUR price (60000) but below the USD one (65000).
        await service.create(user, request("62000", "above", currency="eur"))
        with pytest.raises(HTTPException):
            await service.create(user, request("62000", "above", currency="usd"))

    async def test_refuses_the_same_alert_twice(self, service, session, user):
        await service.create(user, request())
        with pytest.raises(HTTPException) as exc:
            await service.create(user, request("50000.00"))
        assert exc.value.status_code == 409
        assert "déjà" in exc.value.detail

        # The refusal rolled back only the duplicate: the first alert is still there.
        await session.refresh(user)
        assert len((await service.overview(user)).items) == 1

    async def test_caps_alerts_per_account_before_any_market_call(self, service, session, market, user):
        for i in range(MAX_ALERTS_PER_USER):
            await stored_alert(session, user, threshold=Decimal(1000 + i))
        with pytest.raises(HTTPException) as exc:
            await service.create(user, request())
        assert exc.value.status_code == 409
        assert market.coin_calls == 0

    async def test_alerts_that_fired_still_count_towards_the_cap(self, service, session, user):
        for i in range(MAX_ALERTS_PER_USER):
            await stored_alert(session, user, threshold=Decimal(1000 + i), is_active=False)
        with pytest.raises(HTTPException) as exc:
            await service.create(user, request())
        assert exc.value.status_code == 409


class TestOverview:
    async def test_lists_only_your_alerts_newest_first(self, service, session, user):
        other = await make_user(session, "other@example.com")
        await stored_alert(session, other)
        first = await stored_alert(session, user, threshold=Decimal("1000"))
        second = await stored_alert(session, user, threshold=Decimal("2000"))

        overview = await service.overview(user)

        assert sorted(a.id for a in overview.items) == sorted([first.id, second.id])
        assert overview.items[0].id == second.id

    async def test_describes_the_account(self, service, session, monkeypatch):
        monkeypatch.setattr(settings, "PRICE_ALERT_INTERVAL", 600)
        unconfirmed = await make_user(session, "new@example.com", verified=False)
        overview = await service.overview(unconfirmed)
        assert overview.email == "new@example.com"
        assert overview.email_verified is False
        assert overview.alerts_available is True
        assert overview.max_alerts == MAX_ALERTS_PER_USER
        assert overview.check_interval_seconds == 600

    async def test_says_when_alerts_are_unavailable(self, session, market, user):
        service = PriceAlertService(SQLPriceAlertRepository(session), market, None)
        assert (await service.overview(user)).alerts_available is False


class TestManage:
    async def test_can_pause_and_resume(self, service, session, user):
        alert = await stored_alert(session, user)
        paused = await service.set_active(user, alert.id, False)
        assert paused.is_active is False
        resumed = await service.set_active(user, alert.id, True)
        assert resumed.is_active is True

    async def test_turning_back_on_clears_the_last_trigger(self, service, session, user):
        alert = await stored_alert(
            session, user, is_active=False, triggered_at=utcnow(), triggered_price=Decimal("49000")
        )
        out = await service.set_active(user, alert.id, True)
        assert out.is_active is True
        assert out.triggered_at is None
        assert out.triggered_price is None

    async def test_cant_turn_on_an_alert_already_past_its_threshold(self, service, session, market, user):
        alert = await stored_alert(session, user, is_active=False, triggered_at=utcnow())
        set_price(market, 45000)
        with pytest.raises(HTTPException) as exc:
            await service.set_active(user, alert.id, True)
        assert exc.value.status_code == 409
        assert (await reload(session, alert)).is_active is False

    async def test_turning_on_needs_a_confirmed_address_but_pausing_doesnt(self, service, session):
        unconfirmed = await make_user(session, "new@example.com", verified=False)
        alert = await stored_alert(session, unconfirmed)
        await service.set_active(unconfirmed, alert.id, False)
        with pytest.raises(HTTPException) as exc:
            await service.set_active(unconfirmed, alert.id, True)
        assert exc.value.status_code == 403

    async def test_turning_on_an_active_alert_changes_nothing(self, service, session, market, user):
        alert = await stored_alert(session, user)
        await service.set_active(user, alert.id, True)
        assert market.coin_calls == 0

    async def test_can_delete(self, service, session, user):
        alert = await stored_alert(session, user)
        await service.delete(user, alert.id)
        assert (await service.overview(user)).items == []

    @pytest.mark.parametrize("action", ["pause", "delete"])
    async def test_cant_touch_someone_elses_alert(self, service, session, user, action):
        other = await make_user(session, "other@example.com")
        alert = await stored_alert(session, other)
        with pytest.raises(HTTPException) as exc:
            if action == "pause":
                await service.set_active(user, alert.id, False)
            else:
                await service.delete(user, alert.id)
        assert exc.value.status_code == 404
        assert (await reload(session, alert)).is_active is True


class TestUnsubscribe:
    async def test_turns_off_all_of_the_owners_alerts_and_nobody_elses(self, service, session, user):
        other = await make_user(session, "other@example.com")
        mine = [
            await stored_alert(session, user, threshold=Decimal("1000")),
            await stored_alert(session, user, threshold=Decimal("2000")),
        ]
        theirs = await stored_alert(session, other)

        count = await service.unsubscribe(create_email_token(user.id, PURPOSE_STOP_ALERTS))

        assert count == 2
        for alert in mine:
            assert (await reload(session, alert)).is_active is False
        assert (await reload(session, theirs)).is_active is True

    async def test_nothing_is_sent_afterwards(self, service, session, market, sender, user):
        await stored_alert(session, user)
        await service.unsubscribe(create_email_token(user.id, PURPOSE_STOP_ALERTS))
        set_price(market, 40000)
        assert await service.check_all() == 0
        assert sender.sent == []

    async def test_opening_the_link_twice_is_harmless(self, service, session, user):
        await stored_alert(session, user)
        token = create_email_token(user.id, PURPOSE_STOP_ALERTS)
        assert await service.unsubscribe(token) == 1
        assert await service.unsubscribe(token) == 0

    @pytest.mark.parametrize("make_token", [lambda: "garbage", lambda: create_email_token(1, PURPOSE_CONFIRM_EMAIL)])
    async def test_refuses_anything_but_its_own_link(self, service, make_token):
        with pytest.raises(HTTPException) as exc:
            await service.unsubscribe(make_token())
        assert exc.value.status_code == 400


class TestCheck:
    async def test_emails_the_owner_when_the_price_drops_below(self, service, session, market, sender, user):
        alert = await stored_alert(session, user)
        set_price(market, 49870.5)

        assert await service.check_all() == 1

        assert [m.to for m in sender.sent] == ["user@example.com"]
        assert "BTC" in sender.sent[0].subject
        assert "sous" in sender.sent[0].subject
        await reload(session, alert)
        assert alert.is_active is False
        assert alert.triggered_at is not None
        assert alert.triggered_price == Decimal("49870.5")

    async def test_emails_the_owner_when_the_price_goes_above(self, service, session, market, sender, user):
        await stored_alert(session, user, direction="above", threshold=Decimal("85000"))
        set_price(market, 85001)
        assert await service.check_all() == 1
        assert "au-dessus" in sender.sent[0].subject

    async def test_stays_quiet_until_the_threshold_is_reached(self, service, session, sender, user):
        alert = await stored_alert(session, user)
        assert await service.check_all() == 0
        assert sender.sent == []
        assert (await reload(session, alert)).is_active is True

    async def test_fires_only_once_however_long_the_price_stays_there(self, service, session, market, sender, user):
        await stored_alert(session, user)
        set_price(market, 40000)
        await service.check_all()
        await service.check_all()
        await service.check_all()
        assert len(sender.sent) == 1

    async def test_uses_the_price_in_each_alerts_currency(self, service, session, market, sender, user):
        await stored_alert(session, user, currency="eur", threshold=Decimal("50000"))
        await stored_alert(session, user, currency="usd", threshold=Decimal("50000"))
        market.prices["bitcoin"] = {"eur": 49000.0, "usd": 51000.0}

        assert await service.check_all() == 1
        assert "€" in sender.sent[0].subject

    async def test_handles_tiny_prices_exactly(self, service, session, market, sender, user):
        await stored_alert(session, user, coin_id="pepe", threshold=Decimal("0.00001234"))
        market.prices["pepe"] = {"eur": 0.00001233}
        assert await service.check_all() == 1

    async def test_makes_one_market_call_for_all_alerts(self, service, session, market, user):
        other = await make_user(session, "other@example.com")
        await stored_alert(session, user)
        await stored_alert(session, other, currency="usd")
        await stored_alert(session, user, coin_id="ethereum", threshold=Decimal("1000"))
        await service.check_all()
        assert market.live_calls == 1

    async def test_spends_no_market_call_without_active_alerts(self, service, session, market, user):
        await stored_alert(session, user, is_active=False)
        assert await service.check_all() == 0
        assert market.live_calls == 0

    async def test_skips_the_round_when_prices_are_unavailable(self, service, session, market, sender, user):
        alert = await stored_alert(session, user)
        market.fail = True
        assert await service.check_all() == 0
        assert sender.sent == []
        assert (await reload(session, alert)).is_active is True

    @pytest.mark.parametrize(
        "prices",
        [{}, {"bitcoin": {}}, {"bitcoin": {"usd": 1.0}}, {"bitcoin": {"eur": None}}, {"bitcoin": {"eur": 0}}],
    )
    async def test_ignores_a_missing_or_meaningless_price(self, service, session, market, sender, user, prices):
        """A missing price mustn't read as "below every threshold"."""
        alert = await stored_alert(session, user)
        market.prices.clear()
        market.prices.update(prices)
        assert await service.check_all() == 0
        assert sender.sent == []
        assert (await reload(session, alert)).is_active is True

    async def test_retries_at_the_next_check_when_the_email_fails(self, service, session, market, sender, user):
        alert = await stored_alert(session, user)
        set_price(market, 40000)
        sender.fail_all = True

        assert await service.check_all() == 0
        await reload(session, alert)
        assert alert.is_active is True
        assert alert.triggered_at is None
        assert alert.triggered_price is None

        sender.fail_all = False
        assert await service.check_all() == 1
        assert len(sender.sent) == 1

    async def test_one_failed_email_doesnt_block_the_others(self, service, session, market, sender, user):
        other = await make_user(session, "other@example.com")
        await stored_alert(session, user)
        await stored_alert(session, other)
        set_price(market, 40000)
        sender.fail_for = {"user@example.com"}

        assert await service.check_all() == 1
        assert [m.to for m in sender.sent] == ["other@example.com"]

    async def test_never_emails_an_unconfirmed_or_disabled_account(self, service, session, market, sender):
        unconfirmed = await make_user(session, "new@example.com", verified=False)
        disabled = await make_user(session, "off@example.com", active=False)
        await stored_alert(session, unconfirmed)
        await stored_alert(session, disabled)
        set_price(market, 40000)

        assert await service.check_all() == 0
        assert sender.sent == []
        assert market.live_calls == 0

    async def test_two_checks_at_once_send_one_email(self, engine, market, sender, session, user):
        await stored_alert(session, user)
        set_price(market, 40000)
        async with AsyncSession(engine, expire_on_commit=False) as other_session:
            first = PriceAlertService(SQLPriceAlertRepository(session), market, sender)
            second = PriceAlertService(SQLPriceAlertRepository(other_session), market, sender)
            watched = await first.repo.list_deliverable()
            # The second check read the alert before the first one claimed it.
            alert, email = (await second.repo.list_deliverable())[0]
            assert len(watched) == 1
            await first.check_all()
            assert await second._fire(alert, email, Decimal("40000")) is False
        assert len(sender.sent) == 1

    async def test_does_nothing_without_a_sender(self, session, market, user):
        await stored_alert(session, user)
        set_price(market, 40000)
        service = PriceAlertService(SQLPriceAlertRepository(session), market, None)
        assert await service.check_all() == 0
        assert market.live_calls == 0


class TestLoop:
    async def run_loop(self, engine, market, sender, rounds=1):
        """Runs the loop for a few rounds: the sleep after the last one stops it."""
        sleeps = []

        async def fake_sleep(seconds):
            sleeps.append(seconds)
            if len(sleeps) >= rounds:
                raise asyncio.CancelledError

        factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
        with patch("app.services.alerts.price_alert_service.asyncio.sleep", fake_sleep):
            with pytest.raises(asyncio.CancelledError):
                await price_alert_loop(factory, lambda: market, lambda: sender, 600)
        return sleeps

    async def test_checks_then_waits_for_the_interval(self, engine, session, market, sender, user):
        await stored_alert(session, user)
        set_price(market, 40000)
        sleeps = await self.run_loop(engine, market, sender)
        assert sleeps == [600]
        assert len(sender.sent) == 1

    async def test_survives_a_failed_round(self, engine, session, market, sender, user):
        await stored_alert(session, user)
        set_price(market, 40000)
        calls = 0
        real_check = PriceAlertService.check_all

        async def flaky_check(service):
            nonlocal calls
            calls += 1
            if calls == 1:
                raise RuntimeError("database hiccup")
            return await real_check(service)

        with patch.object(PriceAlertService, "check_all", flaky_check):
            await self.run_loop(engine, market, sender, rounds=2)
        assert calls == 2
        assert len(sender.sent) == 1
