"""Signed links sent by email: confirm an address, turn the alerts off.

Each token allows one action and can never open a session. Its purpose is the
"aud" claim, and JWTTokenService.verify_token refuses any token with an audience.
The other way around, python-jose accepts a token without "aud" whatever audience
is requested, so read_email_token checks the claim itself to refuse session tokens.
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.core.jwt_config import JWT_ALGORITHM, JWT_SECRET_KEY

PURPOSE_CONFIRM_EMAIL = "confirm-email"
PURPOSE_STOP_ALERTS = "stop-alerts"

_LIFETIMES = {
    PURPOSE_CONFIRM_EMAIL: timedelta(hours=24),
    # An unsubscribe link has to keep working in an old email.
    PURPOSE_STOP_ALERTS: timedelta(days=365),
}


def create_email_token(user_id: int, purpose: str) -> str:
    now = datetime.now(timezone.utc)
    claims = {
        "sub": str(user_id),
        "aud": purpose,
        "iat": int(now.timestamp()),
        "exp": int((now + _LIFETIMES[purpose]).timestamp()),
    }
    return jwt.encode(claims, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def read_email_token(token: str, purpose: str) -> int | None:
    """The token's user id; None if it's invalid, expired or meant for something else."""
    try:
        claims = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM], audience=purpose)
        if claims.get("aud") != purpose:
            return None
        return int(claims["sub"])
    except (JWTError, KeyError, ValueError):
        return None
