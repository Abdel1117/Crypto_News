import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const addSeriesMock = vi.fn(() => ({ setData: vi.fn() }));
const chartMock = {
  addSeries: addSeriesMock,
  timeScale: () => ({ setVisibleLogicalRange: vi.fn() }),
  resize: vi.fn(),
  remove: vi.fn(),
};

vi.mock("lightweight-charts", () => ({
  createChart: vi.fn(() => chartMock),
  CandlestickSeries: "CandlestickSeries",
  CrosshairMode: { Normal: 0 },
}));
vi.mock("../../app/context/Curency/CurrencyContext", () => ({
  useCurrency: vi.fn(),
}));
vi.mock("../../app/lib/hooks", () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
}));
vi.mock("next/image", () => ({
  default: ({ src, alt, priority, ...props }: any) => (
    <img src={typeof src === "string" ? src : "img"} alt={alt} {...props} />
  ),
}));

import { useCurrency } from "../../app/context/Curency/CurrencyContext";
import { useAppDispatch, useAppSelector } from "../../app/lib/hooks";
import CandleStickGraph from "../../app/components/CandleStickGraph/CandleStickGraph";

class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

const symbols = [{ id: "bitcoin", symbol: "btc", name: "Bitcoin" }];

function setupState(overrides: { prices?: any; marketView?: any } = {}) {
  vi.mocked(useAppSelector).mockImplementation((selector: any) =>
    selector({
      prices: { loading: false, ...overrides.prices },
      marketView: {
        ohlcLoading: false,
        ohlc: [],
        selectedSymbol: "bitcoin",
        selectedTimeFrame: "1d",
        ...overrides.marketView,
      },
    }),
  );
}

describe("CandleStickGraph", () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    vi.mocked(useCurrency).mockReturnValue({ currency: "usd", setCurrency: vi.fn() });
    vi.mocked(useAppDispatch).mockReturnValue(dispatch);
  });

  it("shows the skeleton while ohlc data is loading", () => {
    setupState({ marketView: { ohlcLoading: true } });
    render(<CandleStickGraph symbols={symbols} onSymbolChange={vi.fn()} />);

    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("dispatches fetchOhlcData when a symbol is selected", () => {
    setupState();
    render(<CandleStickGraph symbols={symbols} onSymbolChange={vi.fn()} />);

    expect(dispatch).toHaveBeenCalled();
  });

  it("renders the chart container and creates the chart once data is available", () => {
    setupState({ marketView: { ohlc: [[1700000000000, 1, 2, 0.5, 1.5]] } });
    render(<CandleStickGraph symbols={symbols} onSymbolChange={vi.fn()} />);

    expect(screen.queryByRole("status")).toBeNull();
    expect(addSeriesMock).toHaveBeenCalled();
  });

  it("dispatches setSelectedTimeframe when a timeframe button is clicked", () => {
    setupState();
    render(<CandleStickGraph symbols={symbols} onSymbolChange={vi.fn()} />);

    fireEvent.click(screen.getAllByText("1W")[0]);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: expect.stringContaining("setSelectedTimeframe") }),
    );
  });

  it("changes the currency", () => {
    const setCurrency = vi.fn();
    vi.mocked(useCurrency).mockReturnValue({ currency: "usd", setCurrency });
    setupState();
    render(<CandleStickGraph symbols={symbols} onSymbolChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Monnaie :"), { target: { value: "eur" } });
    expect(setCurrency).toHaveBeenCalledWith("eur");
  });
});
