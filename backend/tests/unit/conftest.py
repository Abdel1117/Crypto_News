import pytest
from app.clients.coingecko_client import clear_cache


@pytest.fixture(autouse=True)
def _reset_coingecko_cache():
    clear_cache()
    yield
    clear_cache()
