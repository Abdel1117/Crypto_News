import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("@/app/lib/hooks", () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
}));
vi.mock("@/app/context/Curency/CurrencyContext", () => ({
  useCurrency: () => ({ currency: "eur" }),
}));
vi.mock("@/app/lib/features/topGainersLosers/topGainersLosersThunks", () => ({
  getTopGainersLosers: vi.fn(() => ({ type: "tgl/fetch" })),
}));
vi.mock("@/app/lib/features/trending/trendingThunks", () => ({
  getTrending: vi.fn(() => ({ type: "trending/fetch" })),
}));
vi.mock("@/app/lib/features/watchlist/watchlistSlice", () => ({
  toggleWatchlist: vi.fn((id: string) => ({
    type: "watchlist/toggle",
    payload: id,
  })),
}));

import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import MoversTable from "@/app/components/Dashboard/MoversTable";

const coin = (id: string, symbol: string, change: number) => ({
  id,
  name: id,
  symbol,
  image: "",
  price: 1.5,
  market_cap: 2e9,
  price_change_percentage: change,
  sparkline: [1, 2, 3],
});

const state = {
  watchlist: { ids: ["sui"] },
  topGainersLosers: {
    topGainers: [coin("sui", "sui", 9.8), coin("tether", "usdt", 0.1)],
    topLosers: [coin("cardano", "ada", -4.3)],
    loading: false,
    error: null,
  },
  trending: {
    coins: [
      {
        id: "pepe",
        name: "Pepe",
        symbol: "pepe",
        image: "",
        price: 0.0000092,
        price_change_24h: 7.6,
        market_cap: "$3,870,000,000",
      },
    ],
    loading: false,
    error: null,
  },
};

describe("MoversTable", () => {
  const dispatch = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(dispatch);
    vi.mocked(useAppSelector).mockImplementation((selector) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selector(state as any),
    );
  });

  const table = () =>
    screen.getByRole("table", { name: "Classement des cryptos" });

  it("fetches movers and trending coins for the current currency", () => {
    render(<MoversTable onSelect={vi.fn()} />);
    expect(dispatch).toHaveBeenCalledWith({ type: "tgl/fetch" });
    expect(dispatch).toHaveBeenCalledWith({ type: "trending/fetch" });
  });

  it("leaves stablecoins out of the gainers", () => {
    render(<MoversTable onSelect={vi.fn()} />);
    expect(within(table()).getByText("sui")).toBeTruthy();
    expect(within(table()).queryByText("tether")).toBeNull();
  });

  it("switches tabs", () => {
    render(<MoversTable onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Perdants" }));
    expect(within(table()).getByText("cardano")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tendances" }));
    expect(within(table()).getByText("Pepe")).toBeTruthy();
    expect(within(table()).getByText(/3,9\sMd\s\$/)).toBeTruthy();
  });

  it("toggles a favourite without selecting the row", () => {
    const onSelect = vi.fn();
    render(<MoversTable onSelect={onSelect} />);
    const star = within(table()).getByRole("button", {
      name: "Retirer sui des favoris",
    });
    expect(star.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(star);
    expect(dispatch).toHaveBeenCalledWith({
      type: "watchlist/toggle",
      payload: "sui",
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("selects a coin from its row", () => {
    const onSelect = vi.fn();
    render(<MoversTable onSelect={onSelect} />);
    fireEvent.click(within(table()).getByRole("button", { name: "sui" }));
    expect(onSelect).toHaveBeenCalledWith("sui");
  });
});
