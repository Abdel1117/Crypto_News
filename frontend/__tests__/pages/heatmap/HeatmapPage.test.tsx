import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../../../app/lib/hooks", () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
}));
vi.mock("../../../app/context/Curency/CurrencyContext", () => ({
  useCurrency: () => ({ currency: "eur", setCurrency: vi.fn() }),
}));
vi.mock("../../../app/lib/features/marketView/marketViewSlice", () => ({
  setSelectedSymbol: vi.fn((id: string) => ({
    type: "marketView/setSelectedSymbol",
    payload: id,
  })),
}));

const useDenseMarketHeatmapMock = vi.fn();
vi.mock("../../../app/hooks/useDenseMarketHeatmap", () => ({
  useDenseMarketHeatmap: (...args: unknown[]) =>
    useDenseMarketHeatmapMock(...args),
}));

vi.mock("../../../app/components/HeatMap/HeatMapTreemap", () => ({
  default: (props: any) => (
    <div data-testid="heatmap-treemap" data-coin-count={props.coins.length}>
      <button onClick={() => props.onSelectCrypto?.("bitcoin")}>
        select
      </button>
    </div>
  ),
}));

import { useAppDispatch } from "../../../app/lib/hooks";
import { setSelectedSymbol } from "../../../app/lib/features/marketView/marketViewSlice";
import HeatmapPage from "../../../app/(app)/heatmap/page";

describe("HeatmapPage", () => {
  const mockDispatch = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(mockDispatch);
    useDenseMarketHeatmapMock.mockReturnValue({
      data: Array.from({ length: 50 }, (_, i) => ({ id: `coin-${i}` })),
      loading: false,
      error: null,
      refresh: mockRefresh,
    });
  });

  it("renders without crashing", () => {
    const { container } = render(<HeatmapPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("requests 50 coins for the current currency", () => {
    render(<HeatmapPage />);
    expect(useDenseMarketHeatmapMock).toHaveBeenCalledWith("eur", 50);
  });

  it("passes the fetched coins through to the treemap", () => {
    render(<HeatmapPage />);
    expect(screen.getByTestId("heatmap-treemap").dataset.coinCount).toBe("50");
  });

  it("calls refresh when the refresh button is clicked", () => {
    render(<HeatmapPage />);
    fireEvent.click(screen.getByRole("button", { name: "Rafraîchir" }));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("dispatches setSelectedSymbol when a tile is selected", () => {
    render(<HeatmapPage />);
    fireEvent.click(screen.getByText("select"));
    expect(setSelectedSymbol).toHaveBeenCalledWith("bitcoin");
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "marketView/setSelectedSymbol",
      payload: "bitcoin",
    });
  });
});
