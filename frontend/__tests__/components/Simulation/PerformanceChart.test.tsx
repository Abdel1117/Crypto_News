import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const addSeriesMock = vi.fn(() => ({ setData: vi.fn() }));
const chartMock = {
  addSeries: addSeriesMock,
  timeScale: () => ({ fitContent: vi.fn() }),
  applyOptions: vi.fn(),
  remove: vi.fn(),
};

vi.mock("lightweight-charts", () => ({
  createChart: vi.fn(() => chartMock),
  LineSeries: "LineSeries",
  LineStyle: { Dotted: 1, Dashed: 2 },
}));
vi.mock("../../../app/lib/hooks", () => ({
  useAppSelector: vi.fn(),
}));
vi.mock("../../../app/context/Curency/CurrencyContext", () => ({
  useCurrency: vi.fn(),
}));

import { createChart } from "lightweight-charts";
import { useAppSelector } from "../../../app/lib/hooks";
import { useCurrency } from "../../../app/context/Curency/CurrencyContext";
import PerformanceChart from "../../../app/components/Simulation/PerformanceChart";

const coins = [
  { id: "btc", symbol: "btc", name: "Bitcoin", image: "/btc.png", price: 120, market_cap: 1, change_24h: 0 },
];

describe("PerformanceChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCurrency).mockReturnValue({ currency: "usd", setCurrency: vi.fn() });
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({
        simulation: {
          balance: 500,
          initialBalance: 1000,
          holdings: [{ coinId: "btc", amount: 5, avgBuyPrice: 100 }],
          portfolioSnapshots: [{ date: "2024-01-01T00:00:00.000Z", value: 1000 }],
        },
        exchangeRate: { usdPerEur: null },
      }),
    );
  });

  it("creates the chart and shows the pnl percentage", () => {
    render(<PerformanceChart coins={coins} />);

    expect(createChart).toHaveBeenCalled();
    // totalValue = 500 + 5*120 = 1100, pnl = +100 (+10.00%)
    expect(screen.getByText("+10.00%")).toBeTruthy();
  });

  it("shows a negative pnl in red when the portfolio lost value", () => {
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({
        simulation: {
          balance: 100,
          initialBalance: 1000,
          holdings: [],
          portfolioSnapshots: [],
        },
        exchangeRate: { usdPerEur: null },
      }),
    );

    render(<PerformanceChart coins={coins} />);
    expect(screen.getByText("-90.00%")).toBeTruthy();
  });
});
