import { describe, expect, it, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

vi.mock("../../../app/lib/api/crypto", () => ({
  fetchPrices: vi.fn(),
}));

import { fetchPrices } from "../../../app/lib/api/crypto";
import { getMarketHeatmap } from "../../../app/lib/features/marketHeatmap/marketHeatmapThunks";
import marketHeatmapReducer from "../../../app/lib/features/marketHeatmap/marketHeatmapSlice";

function makeStore() {
  return configureStore({ reducer: { marketHeatmap: marketHeatmapReducer } });
}

describe("marketHeatmapSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has the expected initial state", () => {
    const store = makeStore();
    expect(store.getState().marketHeatmap).toEqual({
      coins: [],
      loading: false,
      error: null,
    });
  });

  it("sets loading and populates coins on success", async () => {
    const payload = [{ id: "bitcoin" }, { id: "ethereum" }];
    vi.mocked(fetchPrices).mockResolvedValue(payload);

    const store = makeStore();
    const promise = store.dispatch(
      getMarketHeatmap({ currency: "usd", limit: 50 }) as any,
    );
    expect(store.getState().marketHeatmap.loading).toBe(true);

    await promise;

    const state = store.getState().marketHeatmap;
    expect(state.loading).toBe(false);
    expect(state.coins).toEqual(payload);
    expect(fetchPrices).toHaveBeenCalledWith("usd", 50);
  });

  it("stores an error message when the request fails", async () => {
    vi.mocked(fetchPrices).mockRejectedValue(new Error("network down"));

    const store = makeStore();
    await store.dispatch(
      getMarketHeatmap({ currency: "usd", limit: 50 }) as any,
    );

    const state = store.getState().marketHeatmap;
    expect(state.loading).toBe(false);
    expect(state.error).toBe("network down");
  });
});
