import pytest
import httpx
from unittest.mock import AsyncMock, MagicMock, patch

from app.clients.coingecko_client import CoinGeckoClient


def make_mock_http_client(json_data, status_code=200):
    """Return a mock that behaves like the async context-managed httpx.AsyncClient."""
    response = MagicMock(spec=httpx.Response)
    response.json.return_value = json_data
    if status_code >= 400:
        response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "HTTP error", request=MagicMock(), response=response
        )
    else:
        response.raise_for_status.return_value = None

    mock_client = AsyncMock()
    mock_client.get.return_value = response

    mock_cm = MagicMock()
    mock_cm.__aenter__ = AsyncMock(return_value=mock_client)
    mock_cm.__aexit__ = AsyncMock(return_value=False)
    return mock_cm, mock_client


@pytest.fixture
def client():
    return CoinGeckoClient()


class TestFetchMarkets:
    async def test_returns_json_response(self, client):
        expected = [{"id": "bitcoin"}]
        mock_cm, mock_http = make_mock_http_client(expected)
        with patch("httpx.AsyncClient", return_value=mock_cm):
            result = await client.fetch_markets("eur", "market_cap_desc", 10, 1)
        assert result == expected

    async def test_sends_correct_query_params(self, client):
        mock_cm, mock_http = make_mock_http_client([])
        with patch("httpx.AsyncClient", return_value=mock_cm):
            await client.fetch_markets("usd", "volume_desc", 20, 2)
        call_kwargs = mock_http.get.call_args[1]
        params = call_kwargs["params"]
        assert params["vs_currency"] == "usd"
        assert params["order"] == "volume_desc"
        assert params["per_page"] == 20
        assert params["page"] == 2

    async def test_includes_ids_param_when_provided(self, client):
        mock_cm, mock_http = make_mock_http_client([])
        with patch("httpx.AsyncClient", return_value=mock_cm):
            await client.fetch_markets("eur", "market_cap_desc", 1, 1, ids="bitcoin")
        params = mock_http.get.call_args[1]["params"]
        assert params["ids"] == "bitcoin"

    async def test_raises_on_http_error(self, client):
        mock_cm, _ = make_mock_http_client({}, status_code=429)
        with patch("httpx.AsyncClient", return_value=mock_cm):
            with pytest.raises(httpx.HTTPStatusError):
                await client.fetch_markets("eur", "market_cap_desc", 10, 1)


class TestFetchMarketsView:
    async def test_returns_json_response(self, client):
        expected = {"data": {"total_market_cap": {"eur": 1e12}}}
        mock_cm, _ = make_mock_http_client(expected)
        with patch("httpx.AsyncClient", return_value=mock_cm):
            result = await client.fetch_markets_view("eur")
        assert result == expected

    async def test_calls_global_endpoint(self, client):
        mock_cm, mock_http = make_mock_http_client({})
        with patch("httpx.AsyncClient", return_value=mock_cm):
            await client.fetch_markets_view("eur")
        url = mock_http.get.call_args[0][0]
        assert url.endswith("/global")


class TestFetchOhlc:
    async def test_returns_ohlc_list(self, client):
        expected = [[1234567890, 50000, 51000, 49000, 50500]]
        mock_cm, _ = make_mock_http_client(expected)
        with patch("httpx.AsyncClient", return_value=mock_cm):
            result = await client.fetch_ohlc("eur", "1", "bitcoin")
        assert result == expected

    async def test_calls_correct_endpoint_with_coin_id(self, client):
        mock_cm, mock_http = make_mock_http_client([])
        with patch("httpx.AsyncClient", return_value=mock_cm):
            await client.fetch_ohlc("eur", "7", "ethereum")
        url = mock_http.get.call_args[0][0]
        assert "ethereum" in url
        assert url.endswith("/ohlc")

    async def test_sends_correct_params(self, client):
        mock_cm, mock_http = make_mock_http_client([])
        with patch("httpx.AsyncClient", return_value=mock_cm):
            await client.fetch_ohlc("usd", "30", "bitcoin")
        params = mock_http.get.call_args[1]["params"]
        assert params["vs_currency"] == "usd"
        assert params["days"] == "30"


class TestFetchTrending:
    async def test_returns_trending_json(self, client):
        expected = {"coins": []}
        mock_cm, _ = make_mock_http_client(expected)
        with patch("httpx.AsyncClient", return_value=mock_cm):
            result = await client.fetch_trending()
        assert result == expected

    async def test_calls_trending_endpoint(self, client):
        mock_cm, mock_http = make_mock_http_client({})
        with patch("httpx.AsyncClient", return_value=mock_cm):
            await client.fetch_trending()
        url = mock_http.get.call_args[0][0]
        assert "trending" in url


class TestFetchSearch:
    async def test_returns_coins_list_from_response(self, client):
        mock_cm, _ = make_mock_http_client({"coins": [{"id": "bitcoin"}]})
        with patch("httpx.AsyncClient", return_value=mock_cm):
            result = await client.fetch_search("bitcoin")
        assert result == [{"id": "bitcoin"}]

    async def test_returns_empty_list_when_no_coins_key(self, client):
        mock_cm, _ = make_mock_http_client({})
        with patch("httpx.AsyncClient", return_value=mock_cm):
            result = await client.fetch_search("unknown")
        assert result == []

    async def test_sends_query_param(self, client):
        mock_cm, mock_http = make_mock_http_client({"coins": []})
        with patch("httpx.AsyncClient", return_value=mock_cm):
            await client.fetch_search("ethereum")
        params = mock_http.get.call_args[1]["params"]
        assert params["query"] == "ethereum"
