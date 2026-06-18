import pytest

from app.utils.security import PasswordHasher


@pytest.fixture
def hasher() -> PasswordHasher:
    return PasswordHasher()


class TestHash:
    def test_returns_string(self, hasher):
        assert isinstance(hasher.hash("password123"), str)

    def test_differs_from_plain_password(self, hasher):
        plain = "password123"
        assert hasher.hash(plain) != plain

    def test_two_hashes_of_same_password_differ(self, hasher):
        # bcrypt uses a random salt — same input must never produce the same hash
        plain = "password123"
        assert hasher.hash(plain) != hasher.hash(plain)


class TestVerify:
    def test_correct_password_returns_true(self, hasher):
        plain = "correct_password"
        hashed = hasher.hash(plain)
        assert hasher.verify(plain, hashed) is True

    def test_wrong_password_returns_false(self, hasher):
        hashed = hasher.hash("correct_password")
        assert hasher.verify("wrong_password", hashed) is False

    def test_empty_password_returns_false(self, hasher):
        hashed = hasher.hash("some_password")
        assert hasher.verify("", hashed) is False

    def test_case_sensitive(self, hasher):
        hashed = hasher.hash("Password123")
        assert hasher.verify("password123", hashed) is False
