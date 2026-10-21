import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const setDataMock = vi.fn();
const addSeriesMock = vi.fn(() => ({ setData: setDataMock }));
const chartMock = {
  addSeries: addSeriesMock,
  timeScale: () => ({ fitContent: vi.fn() }),
  resize: vi.fn(),
  remove: vi.fn(),
};

vi.mock("lightweight-charts", () => ({
  createChart: vi.fn(() => chartMock),
  AreaSeries: "AreaSeries",
  LineStyle: { Dotted: 1, Dashed: 2 },
  CrosshairMode: { Magnet: 1 },
}));
vi.mock("../../../app/lib/hooks", () => ({
  useAppSelector: vi.fn(),
}));
vi.mock("../../../app/context/Curency/CurrencyContext", () => ({
  useCurrency: vi.fn(),
}));
vi.mock("../../../app/lib/api/crypto", () => ({
  callOhlc: vi.fn(() => Promise.resolve([[1700000000000, 1, 1, 1, 130]])),
}));
vi.mock("../../../app/context/Theme/ThemeContext", () => ({
  useTheme: () => ({ theme: "dark" }),
}));

globalThis.ResizeObserver ??= class {
  observe() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

import { createChart } from "lightweight-charts";
import { useAppSelector } from "../../../app/lib/hooks";
import { useCurrency } from "../../../app/context/Curency/CurrencyContext";
import { callOhlc } from "../../../app/lib/api/crypto";
import PerformanceChart from "../../../app/components/Simulation/PerformanceChart";

const coins = [
  {
    id: "btc",
    symbol: "btc",
    name: "Bitcoin",
    image: "/btc.png",
    price: 120,
    market_cap: 1,
    change_24h: 0,
  },
];

describe("PerformanceChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCurrency).mockReturnValue({
      currency: "usd",
      setCurrency: vi.fn(),
    });
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({
        simulation: {
          balance: 500,
          initialBalance: 1000,
          realizedPnl: 0,
          holdings: [
            {
              coinId: "btc",
              coinName: "Bitcoin",
              coinSymbol: "btc",
              coinImage: "/btc.png",
              amount: 5,
              avgBuyPrice: 100,
            },
          ],
          portfolioSnapshots: [
            { date: "2024-01-01T00:00:00.000Z", value: 1000 },
          ],
        },
        exchangeRate: { usdPerEur: null },
      }),
    );
  });

  it("draws the portfolio value with the live point appended", () => {
    render(<PerformanceChart coins={coins} />);

    expect(createChart).toHaveBeenCalled();
    expect(addSeriesMock).toHaveBeenCalledWith("AreaSeries", expect.any(Object));
    expect(screen.getByRole("heading", { name: "Performance" })).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Portefeuille" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    // snapshot (1000) + live value: 500 cash + 5 × 120 = 1100
    const data = setDataMock.mock.calls.at(-1)?.[0];
    expect(data[0].value).toBe(1000);
    expect(data.at(-1).value).toBe(1100);
  });

  it("offers one curve per held coin and loads its price history", async () => {
    render(<PerformanceChart coins={coins} />);

    fireEvent.click(screen.getByRole("button", { name: "Bitcoin" }));
    fireEvent.click(screen.getByRole("button", { name: "1 mois" }));

    await waitFor(() =>
      expect(callOhlc).toHaveBeenCalledWith("usd", "1m", "btc"),
    );
    await waitFor(() =>
      expect(setDataMock).toHaveBeenLastCalledWith([
        { time: 1700000000, value: 130 },
      ]),
    );
  });

  it("renders a bare chart in compact mode", () => {
    render(<PerformanceChart coins={coins} variant="compact" />);

    expect(screen.queryByRole("heading", { name: "Performance" })).toBeNull();
    expect(createChart).toHaveBeenCalled();
  });
});
