import { describe, expect, it, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

vi.mock("../../../app/lib/api/crypto", () => ({
  fetchPrices: vi.fn(),
  fetchMarketCoin: vi.fn(),
}));

import { fetchPrices, fetchMarketCoin } from "../../../app/lib/api/crypto";
import { getPrices, getMarketCoin } from "../../../app/lib/features/prices/pricesThunks";
import pricesReducer, {
  setCoins,
  setLoading,
  setConnected,
} from "../../../app/lib/features/prices/pricesSlice";

// NOTE: `addOrUpdateCoin` is defined as a reducer in pricesSlice.ts but is not
// exported from `priceSlice.actions`, so it can never be dispatched by the app.
// Dispatched here via its literal action type to cover the reducer logic anyway.
const addOrUpdateCoin = (payload: any) => ({ type: "prices/addOrUpdateCoin", payload });

function makeStore() {
  return configureStore({ reducer: { prices: pricesReducer } });
}

describe("pricesSlice reducers", () => {
  it("replaces the coin list and clears loading", () => {
    const state = pricesReducer(
      { coins: [], loading: true, connected: false },
      setCoins([{ id: "btc" } as any]),
    );
    expect(state.coins).toEqual([{ id: "btc" }]);
    expect(state.loading).toBe(false);
  });

  it("adds a new coin", () => {
    const state = pricesReducer(
      { coins: [], loading: false, connected: false },
      addOrUpdateCoin({ id: "btc" } as any),
    );
    expect(state.coins).toEqual([{ id: "btc" }]);
  });

  it("updates an existing coin in place", () => {
    const state = pricesReducer(
      { coins: [{ id: "btc", price: 1 } as any], loading: false, connected: false },
      addOrUpdateCoin({ id: "btc", price: 2 } as any),
    );
    expect(state.coins).toEqual([{ id: "btc", price: 2 }]);
  });

  it("sets the loading and connected flags", () => {
    let state = pricesReducer({ coins: [], loading: false, connected: false }, setLoading(true));
    expect(state.loading).toBe(true);
    state = pricesReducer(state, setConnected(true));
    expect(state.connected).toBe(true);
  });
});

describe("pricesSlice thunks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("populates coins when getPrices succeeds", async () => {
    vi.mocked(fetchPrices).mockResolvedValue([{ id: "btc" }]);
    const store = makeStore();

    await store.dispatch(getPrices("usd") as any);

    expect(store.getState().prices.coins).toEqual([{ id: "btc" }]);
    expect(store.getState().prices.loading).toBe(false);
  });

  it("stops loading without throwing when the api call fails", async () => {
    vi.mocked(fetchPrices).mockRejectedValue(new Error("boom"));
    const store = makeStore();

    await store.dispatch(getPrices("usd") as any);

    expect(store.getState().prices.loading).toBe(false);
  });

  it("upserts a coin returned by getMarketCoin", async () => {
    vi.mocked(fetchMarketCoin).mockResolvedValue({ id: "eth" });
    const store = makeStore();

    await store.dispatch(getMarketCoin({ currency: "usd", cryptoId: "eth" }) as any);

    expect(store.getState().prices.coins).toEqual([{ id: "eth" }]);
  });

  it("ignores a malformed getMarketCoin payload", async () => {
    vi.mocked(fetchMarketCoin).mockResolvedValue(null);
    const store = makeStore();

    await store.dispatch(getMarketCoin({ currency: "usd", cryptoId: "eth" }) as any);

    expect(store.getState().prices.coins).toEqual([]);
  });
});
