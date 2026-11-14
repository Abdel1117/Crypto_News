import re
from datetime import timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlmodel import SQLModel

from app.auth.email_tokens import PURPOSE_CONFIRM_EMAIL, PURPOSE_STOP_ALERTS, create_email_token
from app.models.user import User
from app.repositories.users.user_sql_repo import SQLUserRepository
from app.services.email.verification_service import RESEND_COOLDOWN, EmailVerificationService
from app.utils.dates import as_utc, utcnow

from tests.unit.alert_helpers import FakeSender


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite://")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    async with AsyncSession(engine, expire_on_commit=False) as s:
        yield s
    await engine.dispose()


@pytest.fixture
async def user(session):
    row = User(full_name="Test", email="user@example.com")
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return row


@pytest.fixture
def sender():
    return FakeSender()


@pytest.fixture
def service(session, sender):
    return EmailVerificationService(SQLUserRepository(session), sender)


def emailed_token(message) -> str:
    return re.search(r"token=([\w.\-]+)", message.text_body).group(1)


class TestSendLink:
    async def test_emails_a_link_that_confirms_the_address(self, service, sender, user):
        assert await service.send_link(user) is True

        assert [m.to for m in sender.sent] == ["user@example.com"]
        assert user.email_verified_at is None  # sending isn't confirming

        await service.confirm(emailed_token(sender.sent[0]))
        assert user.email_verified_at is not None

    async def test_nothing_to_send_when_already_confirmed(self, service, sender, user):
        user.email_verified_at = utcnow()
        assert await service.send_link(user) is False
        assert sender.sent == []

    async def test_explains_when_email_isnt_configured(self, session, user):
        service = EmailVerificationService(SQLUserRepository(session), None)
        with pytest.raises(HTTPException) as exc:
            await service.send_link(user)
        assert exc.value.status_code == 503

    async def test_limits_how_often_a_link_can_be_requested(self, service, sender, user):
        await service.send_link(user)
        with pytest.raises(HTTPException) as exc:
            await service.send_link(user)
        assert exc.value.status_code == 429
        assert len(sender.sent) == 1

    async def test_cooldown_survives_a_reload_from_the_database(self, service, session, sender, user):
        """SQLite hands back naive datetimes: comparing them must not crash."""
        await service.send_link(user)
        await session.refresh(user)
        with pytest.raises(HTTPException) as exc:
            await service.send_link(user)
        assert exc.value.status_code == 429

    async def test_a_new_link_can_be_requested_after_the_cooldown(self, service, sender, user):
        await service.send_link(user)
        user.email_verification_sent_at = utcnow() - RESEND_COOLDOWN - timedelta(seconds=1)
        await service.send_link(user)
        assert len(sender.sent) == 2

    async def test_a_failed_send_doesnt_start_the_cooldown(self, service, sender, user):
        sender.fail_all = True
        with pytest.raises(HTTPException) as exc:
            await service.send_link(user)
        assert exc.value.status_code == 502
        assert user.email_verification_sent_at is None

        sender.fail_all = False
        await service.send_link(user)
        assert len(sender.sent) == 1


class TestConfirm:
    @pytest.mark.parametrize("token", ["", "not-a-token"])
    async def test_refuses_an_invalid_link(self, service, token):
        with pytest.raises(HTTPException) as exc:
            await service.confirm(token)
        assert exc.value.status_code == 400

    async def test_refuses_a_link_meant_for_something_else(self, service, user):
        with pytest.raises(HTTPException) as exc:
            await service.confirm(create_email_token(user.id, PURPOSE_STOP_ALERTS))
        assert exc.value.status_code == 400
        assert user.email_verified_at is None

    async def test_refuses_a_link_for_an_unknown_account(self, service):
        with pytest.raises(HTTPException) as exc:
            await service.confirm(create_email_token(99999, PURPOSE_CONFIRM_EMAIL))
        assert exc.value.status_code == 400

    async def test_refuses_a_link_for_a_disabled_account(self, service, session, user):
        user.is_active = False
        await session.commit()
        with pytest.raises(HTTPException) as exc:
            await service.confirm(create_email_token(user.id, PURPOSE_CONFIRM_EMAIL))
        assert exc.value.status_code == 400
        assert user.email_verified_at is None

    async def test_opening_the_link_twice_keeps_the_first_date(self, service, session, user):
        token = create_email_token(user.id, PURPOSE_CONFIRM_EMAIL)
        await service.confirm(token)
        first = user.email_verified_at
        await service.confirm(token)
        await session.refresh(user)
        assert as_utc(user.email_verified_at) == as_utc(first)
