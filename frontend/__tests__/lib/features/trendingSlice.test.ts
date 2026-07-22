import { describe, expect, it, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

vi.mock("../../../app/lib/api/crypto", () => ({
  fetchTrending: vi.fn(),
}));

import { fetchTrending } from "../../../app/lib/api/crypto";
import { getTrending } from "../../../app/lib/features/trending/trendingThunks";
import trendingReducer from "../../../app/lib/features/trending/trendingSlice";

function makeStore() {
  return configureStore({ reducer: { trending: trendingReducer } });
}

describe("trendingSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks loading while the request is in flight, then stores the coins", async () => {
    vi.mocked(fetchTrending).mockResolvedValue([{ id: "btc" }]);
    const store = makeStore();

    const promise = store.dispatch(getTrending() as any);
    expect(store.getState().trending.loading).toBe(true);

    await promise;

    expect(store.getState().trending.loading).toBe(false);
    expect(store.getState().trending.coins).toEqual([{ id: "btc" }]);
  });

  it("stores an error message when the request fails", async () => {
    vi.mocked(fetchTrending).mockRejectedValue(new Error("network down"));
    const store = makeStore();

    await store.dispatch(getTrending() as any);

    expect(store.getState().trending.loading).toBe(false);
    expect(store.getState().trending.error).toBe("network down");
  });
});
