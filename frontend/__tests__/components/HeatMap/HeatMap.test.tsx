import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../../app/context/Curency/CurrencyContext", () => ({
  useCurrency: () => ({ currency: "eur", setCurrency: vi.fn() }),
}));

const useMarketHeatmapMock = vi.fn();
vi.mock("../../../app/hooks/useMarketHeatmap", () => ({
  useMarketHeatmap: (...args: unknown[]) => useMarketHeatmapMock(...args),
}));

vi.mock("../../../app/components/HeatMap/HeatMapTreemap", () => ({
  default: (props: any) => (
    <div
      data-testid="heatmap-treemap"
      data-coin-count={props.coins.length}
      data-loading={String(props.loading)}
      data-error={props.error ?? ""}
    />
  ),
}));

import HeatMap from "../../../app/components/HeatMap/HeatMap";

describe("HeatMap", () => {
  it("fetches the top 20 coins for the dashboard widget", () => {
    useMarketHeatmapMock.mockReturnValue({
      data: [{ id: "bitcoin" }, { id: "ethereum" }],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<HeatMap />);

    expect(useMarketHeatmapMock).toHaveBeenCalledWith("eur", 20);
    expect(screen.getByTestId("heatmap-treemap").dataset.coinCount).toBe("2");
  });

  it("passes loading and error states through to the treemap", () => {
    useMarketHeatmapMock.mockReturnValue({
      data: [],
      loading: true,
      error: "Boom",
      refresh: vi.fn(),
    });

    render(<HeatMap />);

    const node = screen.getByTestId("heatmap-treemap");
    expect(node.dataset.loading).toBe("true");
    expect(node.dataset.error).toBe("Boom");
  });
});
