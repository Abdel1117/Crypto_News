import { describe, expect, it, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

vi.mock("../../../app/lib/api/crypto", () => ({
  fetchTopWinnersLosers: vi.fn(),
}));

import { fetchTopWinnersLosers } from "../../../app/lib/api/crypto";
import { getTopGainersLosers } from "../../../app/lib/features/topGainersLosers/topGainersLosersThunks";
import topGainersLosersReducer from "../../../app/lib/features/topGainersLosers/topGainersLosersSlice";

function makeStore() {
  return configureStore({ reducer: { topGainersLosers: topGainersLosersReducer } });
}

describe("topGainersLosersSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has the expected initial state", () => {
    const store = makeStore();
    expect(store.getState().topGainersLosers).toEqual({
      topGainers: [],
      topLosers: [],
      loading: false,
      error: null,
    });
  });

  it("sets loading and populates gainers/losers on success", async () => {
    const payload = {
      top_gainers: [{ id: "btc" }],
      top_losers: [{ id: "eth" }],
    };
    vi.mocked(fetchTopWinnersLosers).mockResolvedValue(payload);

    const store = makeStore();
    const promise = store.dispatch(getTopGainersLosers("usd") as any);
    expect(store.getState().topGainersLosers.loading).toBe(true);

    await promise;

    const state = store.getState().topGainersLosers;
    expect(state.loading).toBe(false);
    expect(state.topGainers).toEqual(payload.top_gainers);
    expect(state.topLosers).toEqual(payload.top_losers);
    expect(fetchTopWinnersLosers).toHaveBeenCalledWith("usd");
  });

  it("stores an error message when the request fails", async () => {
    vi.mocked(fetchTopWinnersLosers).mockRejectedValue(new Error("network down"));

    const store = makeStore();
    await store.dispatch(getTopGainersLosers("usd") as any);

    const state = store.getState().topGainersLosers;
    expect(state.loading).toBe(false);
    expect(state.error).toBe("network down");
  });
});
