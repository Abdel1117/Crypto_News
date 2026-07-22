import { describe, expect, it, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

vi.mock("../../../app/lib/api/crypto", () => ({
  callOhlc: vi.fn(),
}));

import { callOhlc } from "../../../app/lib/api/crypto";
import { fetchOhlcData } from "../../../app/lib/features/marketView/marketViewThunk";
import marketViewReducer, {
  setSelectedSymbol,
  setSelectedTimeframe,
} from "../../../app/lib/features/marketView/marketViewSlice";

function makeStore() {
  return configureStore({ reducer: { marketView: marketViewReducer } });
}

describe("marketViewSlice reducers", () => {
  it("updates the selected symbol and timeframe", () => {
    const store = makeStore();
    store.dispatch(setSelectedSymbol("ethereum"));
    expect(store.getState().marketView.selectedSymbol).toBe("ethereum");

    store.dispatch(setSelectedTimeframe("1w"));
    expect(store.getState().marketView.selectedTimeFrame).toBe("1w");
  });

  it("clears ohlc data and stores the error message on rejection", () => {
    const state = marketViewReducer(
      { selectedSymbol: "bitcoin", selectedTimeFrame: "1d", ohlc: [1, 2, 3], ohlcLoading: true, ohlcError: null },
      fetchOhlcData.rejected(new Error("boom"), "req-1", { currency: "usd", selectedTimeFrame: "1d", cryptoId: "bitcoin" }, "boom"),
    );

    expect(state.ohlcLoading).toBe(false);
    expect(state.ohlc).toEqual([]);
    expect(state.ohlcError).toBe("boom");
  });
});

describe("marketViewSlice thunk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores the ohlc data on success", async () => {
    vi.mocked(callOhlc).mockResolvedValue([[1, 2, 3, 4]]);
    const store = makeStore();

    const promise = store.dispatch(
      fetchOhlcData({ currency: "usd", selectedTimeFrame: "1d", cryptoId: "bitcoin" }) as any,
    );
    expect(store.getState().marketView.ohlcLoading).toBe(true);

    await promise;

    expect(store.getState().marketView.ohlcLoading).toBe(false);
    expect(store.getState().marketView.ohlc).toEqual([[1, 2, 3, 4]]);
    expect(callOhlc).toHaveBeenCalledWith("usd", "1d", "bitcoin");
  });

  it("resolves with the error instead of throwing when the api call fails", async () => {
    const error = new Error("api down");
    vi.mocked(callOhlc).mockRejectedValue(error);
    const store = makeStore();

    await store.dispatch(
      fetchOhlcData({ currency: "usd", selectedTimeFrame: "1d", cryptoId: "bitcoin" }) as any,
    );

    expect(store.getState().marketView.ohlcLoading).toBe(false);
    expect(store.getState().marketView.ohlc).toBe(error);
  });
});
