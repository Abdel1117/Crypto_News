import { describe, expect, it, vi, afterEach } from "vitest";
import {
  fetchPrices,
  fetchSymbols,
  searchSymbols,
  fetchMarketCoin,
  callOhlc,
  getMarketView,
  fetchTopWinnersLosers,
  fetchTrending,
} from "../../app/lib/api/crypto";

function mockFetchOnce(ok: boolean, json: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok, json: async () => json }),
  );
}

describe("api/crypto", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetchPrices returns data on success", async () => {
    mockFetchOnce(true, [{ id: "btc" }]);
    await expect(fetchPrices("usd")).resolves.toEqual([{ id: "btc" }]);
  });

  it("fetchPrices throws on failure", async () => {
    mockFetchOnce(false, {});
    await expect(fetchPrices("usd")).rejects.toThrow("Failed to fetch prices");
  });

  it("fetchSymbols returns data on success", async () => {
    mockFetchOnce(true, [{ id: "eth" }]);
    await expect(fetchSymbols("usd")).resolves.toEqual([{ id: "eth" }]);
  });

  it("fetchSymbols throws on failure", async () => {
    mockFetchOnce(false, {});
    await expect(fetchSymbols("usd")).rejects.toThrow("Failed to fetch Symbols");
  });

  it("searchSymbols returns data on success", async () => {
    mockFetchOnce(true, [{ id: "sol" }]);
    await expect(searchSymbols("sol")).resolves.toEqual([{ id: "sol" }]);
  });

  it("searchSymbols throws on failure", async () => {
    mockFetchOnce(false, {});
    await expect(searchSymbols("sol")).rejects.toThrow("Failed to search symbols");
  });

  it("fetchMarketCoin returns data on success", async () => {
    mockFetchOnce(true, { id: "btc" });
    await expect(fetchMarketCoin("usd", "btc")).resolves.toEqual({ id: "btc" });
  });

  it("fetchMarketCoin throws on failure", async () => {
    mockFetchOnce(false, {});
    await expect(fetchMarketCoin("usd", "btc")).rejects.toThrow("Failed to fetch market coin");
  });

  it("callOhlc returns data on success", async () => {
    mockFetchOnce(true, [[1, 2, 3, 4]]);
    await expect(callOhlc("usd", "1d", "btc")).resolves.toEqual([[1, 2, 3, 4]]);
  });

  it("callOhlc throws on failure", async () => {
    mockFetchOnce(false, {});
    await expect(callOhlc("usd", "1d", "btc")).rejects.toThrow("Failed to fetch Symbols");
  });

  it("getMarketView returns data on success", async () => {
    mockFetchOnce(true, { view: "table" });
    await expect(getMarketView("usd")).resolves.toEqual({ view: "table" });
  });

  it("getMarketView throws on failure", async () => {
    mockFetchOnce(false, {});
    await expect(getMarketView("usd")).rejects.toThrow("Failed to fetch MarketView");
  });

  it("fetchTopWinnersLosers returns data on success", async () => {
    mockFetchOnce(true, { top_gainers: [], top_losers: [] });
    await expect(fetchTopWinnersLosers("usd")).resolves.toEqual({ top_gainers: [], top_losers: [] });
  });

  it("fetchTopWinnersLosers throws on failure", async () => {
    mockFetchOnce(false, {});
    await expect(fetchTopWinnersLosers("usd")).rejects.toThrow("Failed to fetch top winners/losers");
  });

  it("fetchTrending returns data on success", async () => {
    mockFetchOnce(true, [{ id: "btc" }]);
    await expect(fetchTrending()).resolves.toEqual([{ id: "btc" }]);
  });

  it("fetchTrending throws on failure", async () => {
    mockFetchOnce(false, {});
    await expect(fetchTrending()).rejects.toThrow("Failed to fetch trending coins");
  });
});
