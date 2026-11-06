from datetime import datetime, timezone


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def as_utc(value: datetime) -> datetime:
    """SQLite returns naive datetimes; everything is stored in UTC."""
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
