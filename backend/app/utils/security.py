from typing import Protocol

import bcrypt


class PasswordHasherProtocol(Protocol):
    def hash(self, password: str) -> str:
        ...

    def verify(self, plain_password: str, hashed_password: str) -> bool:
        ...


class PasswordHasher(PasswordHasherProtocol):
    def hash(self, password: str) -> str:
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    def verify(self, plain_password: str, hashed_password: str) -> bool:
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception:
            return False


_DUMMY_HASH: str | None = None


def dummy_password_hash() -> str:
    """A real bcrypt hash to compare against when the account doesn't exist,
    so failed logins take the same time whether or not the email is known."""
    global _DUMMY_HASH
    if _DUMMY_HASH is None:
        _DUMMY_HASH = PasswordHasher().hash("dummy-password-for-timing")
    return _DUMMY_HASH
