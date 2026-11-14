from datetime import datetime, timezone
from decimal import Decimal

from app.services.simulation.engine import TradeRecord

D = Decimal

_next_id = [0]


def at(year: int, month: int, day: int, hour: int = 12) -> datetime:
    return datetime(year, month, day, hour, tzinfo=timezone.utc)


def trade(
    side: str,
    quantity,
    price,
    when: datetime,
    coin: str = "bitcoin",
    fee=None,
    value_before=None,
    trade_id: int | None = None,
) -> TradeRecord:
    """A trade with gross = quantity × price; fee defaults to 0 for readable numbers."""
    _next_id[0] += 1
    quantity, price = D(str(quantity)), D(str(price))
    gross = quantity * price
    return TradeRecord(
        id=trade_id if trade_id is not None else _next_id[0],
        coin_id=coin,
        symbol=coin[:3].upper(),
        name=coin.capitalize(),
        image="",
        side=side,
        quantity=quantity,
        price=price,
        gross=gross,
        fee=D(str(fee)) if fee is not None else D("0"),
        executed_at=when,
        crypto_value_before=D(str(value_before)) if value_before is not None else None,
    )
