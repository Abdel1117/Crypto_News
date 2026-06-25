import pytest
import httpx
from unittest.mock import AsyncMock, patch

from app.main import app
from app.db.session import get_session


@pytest.fixture(autouse=True)
def clear_dependency_overrides():
    """Ensures dependency overrides are always cleaned up between tests."""
    yield
    app.dependency_overrides.clear()


@pytest.fixture
async def client():
    """
    Async HTTP client pointed at the FastAPI ASGI app.
    - init_db is mocked so no real SQLite setup happens on startup.
    - get_session is overridden with an AsyncMock so no real DB is needed.
    """
    mock_session = AsyncMock()
    app.dependency_overrides[get_session] = lambda: mock_session

    with patch("app.main.init_db", new_callable=AsyncMock):
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app, raise_app_exceptions=False),
            base_url="http://test",
        ) as ac:
            yield ac
