import { describe, expect, it, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

vi.mock("../../../app/lib/api/crypto", () => ({
  fetchSymbols: vi.fn(),
}));

import { fetchSymbols } from "../../../app/lib/api/crypto";
import { getSymbols } from "../../../app/lib/features/symbol/symbolThunks";
import symbolReducer, {
  setSymbols,
  setLoading,
  setConnected,
  addSymbolIfMissing,
  readLocalSymbols,
  saveLocalSymbols,
} from "../../../app/lib/features/symbol/symbolSlice";

// NOTE: `initSymbols` is defined as a reducer in symbolSlice.ts but is not
// exported from `symbolSlice.actions`, so it can never be dispatched by the app.
// Dispatched here via its literal action type to cover the reducer logic anyway.
const initSymbols = (payload: any) => ({ type: "symbols/initSymbols", payload });

function makeStore() {
  return configureStore({ reducer: { symbols: symbolReducer } });
}

const btc = { id: "btc", symbol: "btc", name: "Bitcoin" };
const eth = { id: "eth", symbol: "eth", name: "Ethereum" };

describe("symbolSlice reducers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes symbols from a persisted list", () => {
    const store = makeStore();
    store.dispatch(initSymbols([btc]));

    expect(store.getState().symbols.symbols).toEqual([btc]);
  });

  it("upserts symbols and persists them to localStorage", () => {
    const store = makeStore();
    store.dispatch(setSymbols([btc, eth]));

    expect(store.getState().symbols.symbols).toHaveLength(2);
    expect(store.getState().symbols.loading).toBe(false);
    expect(JSON.parse(localStorage.getItem("symbols")!)).toHaveLength(2);
  });

  it("sets loading and connected flags", () => {
    const store = makeStore();
    store.dispatch(setLoading(true));
    expect(store.getState().symbols.loading).toBe(true);
    store.dispatch(setConnected(true));
    expect(store.getState().symbols.connected).toBe(true);
  });

  it("adds a symbol only if it is not already present", () => {
    const store = makeStore();
    store.dispatch(initSymbols([btc]));
    store.dispatch(addSymbolIfMissing(btc));
    expect(store.getState().symbols.symbols).toHaveLength(1);

    store.dispatch(addSymbolIfMissing(eth));
    expect(store.getState().symbols.symbols).toHaveLength(2);
  });
});

describe("symbolSlice thunk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges fetched symbols without wiping existing ones", async () => {
    vi.mocked(fetchSymbols).mockResolvedValue([eth]);
    const store = makeStore();
    store.dispatch(initSymbols([btc]));

    await store.dispatch(getSymbols("usd") as any);

    const state = store.getState().symbols;
    expect(state.loading).toBe(false);
    expect(state.symbols.map((s) => s.id).sort()).toEqual(["btc", "eth"]);
  });

  it("stops loading when the fetch is rejected outright", async () => {
    vi.mocked(fetchSymbols).mockRejectedValue(new Error("boom"));
    const store = makeStore();

    await store.dispatch(getSymbols("usd") as any);

    expect(store.getState().symbols.loading).toBe(false);
  });
});

describe("readLocalSymbols / saveLocalSymbols", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns an empty array when nothing is stored", () => {
    expect(readLocalSymbols()).toEqual([]);
  });

  it("round-trips symbols through localStorage", () => {
    saveLocalSymbols([btc]);
    expect(readLocalSymbols()).toEqual([btc]);
  });

  it("returns an empty array when storage contains invalid JSON", () => {
    localStorage.setItem("symbols", "not-json");
    expect(readLocalSymbols()).toEqual([]);
  });
});
