import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

vi.mock("../../app/lib/api/crypto", () => ({
  fetchPrices: vi.fn(),
}));

import { fetchPrices } from "../../app/lib/api/crypto";
import marketHeatmapReducer from "../../app/lib/features/marketHeatmap/marketHeatmapSlice";
import { useDenseMarketHeatmap } from "../../app/hooks/useDenseMarketHeatmap";

function wrapper({ children }: { children: React.ReactNode }) {
  const store = configureStore({ reducer: { marketHeatmap: marketHeatmapReducer } });
  return <Provider store={store}>{children}</Provider>;
}

describe("useDenseMarketHeatmap", () => {
  beforeEach(() => {
    vi.mocked(fetchPrices).mockReset();
  });

  it("fetches the requested limit for the given currency on mount", async () => {
    const coins = [{ id: "bitcoin" }, { id: "ethereum" }];
    vi.mocked(fetchPrices).mockResolvedValue(coins);

    const { result } = renderHook(() => useDenseMarketHeatmap("usd", 50), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(coins));
    expect(fetchPrices).toHaveBeenCalledWith("usd", 50);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("re-fetches when refresh is called", async () => {
    vi.mocked(fetchPrices).mockResolvedValue([]);
    const { result } = renderHook(() => useDenseMarketHeatmap("usd", 50), {
      wrapper,
    });

    await waitFor(() => expect(fetchPrices).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => expect(fetchPrices).toHaveBeenCalledTimes(2));
  });

  it("re-fetches when currency changes", async () => {
    vi.mocked(fetchPrices).mockResolvedValue([]);
    const { rerender } = renderHook(
      ({ currency }) => useDenseMarketHeatmap(currency, 50),
      { wrapper, initialProps: { currency: "usd" } },
    );

    await waitFor(() => expect(fetchPrices).toHaveBeenCalledWith("usd", 50));

    rerender({ currency: "eur" });

    await waitFor(() => expect(fetchPrices).toHaveBeenCalledWith("eur", 50));
  });

  it("surfaces an error message when the fetch fails", async () => {
    vi.mocked(fetchPrices).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useDenseMarketHeatmap("usd", 50), {
      wrapper,
    });

    await waitFor(() => expect(result.current.error).toBe("network down"));
    expect(result.current.data).toEqual([]);
  });
});
