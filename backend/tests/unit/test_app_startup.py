from unittest.mock import AsyncMock, patch

import pytest

import app.main as main
from app.core.config import settings


@pytest.fixture
async def started(monkeypatch):
    """Runs the startup hook with the loops faked, and returns the alert loop's mock."""
    monkeypatch.setattr(settings, "SIM_SNAPSHOT_INTERVAL", 0)
    monkeypatch.setattr(main, "init_db", AsyncMock())
    alert_loop = AsyncMock()
    monkeypatch.setattr(main, "price_alert_loop", alert_loop)

    async def start():
        await main.on_startup()
        return alert_loop

    yield start
    await main.on_shutdown()
    main._background_tasks.clear()


def configure(monkeypatch, host="smtp.test", user="login@example.com", interval=600):
    monkeypatch.setattr(settings, "SMTP_HOST", host)
    monkeypatch.setattr(settings, "SMTP_USER", user)
    monkeypatch.setattr(settings, "PRICE_ALERT_INTERVAL", interval)


class TestPriceAlertLoopStartup:
    async def test_starts_with_email_configured(self, monkeypatch, started):
        configure(monkeypatch)
        alert_loop = await started()
        assert len(main._background_tasks) == 1
        assert alert_loop.call_args.args[-1] == 600

    async def test_stays_off_without_email_and_says_why(self, monkeypatch, started):
        configure(monkeypatch, host="", user="")
        with patch.object(main.logger, "warning") as warning:
            await started()
        assert main._background_tasks == set()
        warning.assert_called_once()

    async def test_can_be_turned_off(self, monkeypatch, started):
        configure(monkeypatch, interval=0)
        await started()
        assert main._background_tasks == set()
