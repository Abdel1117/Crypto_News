import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ src, alt, priority, ...props }: any) => (
    <img src={typeof src === "string" ? src : "img"} alt={alt} {...props} />
  ),
}));
vi.mock("../../app/lib/hooks", () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
}));
vi.mock("../../app/context/Curency/CurrencyContext", () => ({
  useCurrency: vi.fn(),
}));

import { useAppDispatch, useAppSelector } from "../../app/lib/hooks";
import { useCurrency } from "../../app/context/Curency/CurrencyContext";
import TopGainersLosers from "../../app/components/TopGainersLosers/TopGainersLosers";

const gainer = {
  id: "btc",
  symbol: "BTC",
  name: "Bitcoin",
  image: "/btc.png",
  price: 50000,
  market_cap: 1000000,
  price_change_percentage: 5.2,
  sparkline: Array.from({ length: 40 }, (_, i) => 100 + i),
};

function setupState(overrides: any = {}) {
  vi.mocked(useAppSelector).mockImplementation((selector: any) =>
    selector({
      topGainersLosers: { topGainers: [gainer], topLosers: [], loading: false, error: null, ...overrides.topGainersLosers },
      trending: { coins: [], loading: false, error: null, ...overrides.trending },
    }),
  );
}

describe("TopGainersLosers", () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(dispatch);
    vi.mocked(useCurrency).mockReturnValue({ currency: "usd", setCurrency: vi.fn() });
  });

  it("dispatches the gainers/losers and trending fetches on mount", () => {
    setupState();
    render(<TopGainersLosers onSymbolChange={vi.fn()} />);
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it("shows gainers by default and selects a coin on row click", () => {
    setupState();
    const onSymbolChange = vi.fn();
    render(<TopGainersLosers onSymbolChange={onSymbolChange} />);

    expect(screen.getByText("Bitcoin")).toBeTruthy();
    fireEvent.click(screen.getByText("Bitcoin"));
    expect(onSymbolChange).toHaveBeenCalledWith("btc");
  });

  it("switches to the losers tab", () => {
    setupState({
      topGainersLosers: {
        topGainers: [gainer],
        topLosers: [{ ...gainer, id: "eth", name: "Ethereum", price_change_percentage: -3 }],
      },
    });
    render(<TopGainersLosers onSymbolChange={vi.fn()} />);

    fireEvent.click(screen.getByText("Perdants"));
    expect(screen.getByText("Ethereum")).toBeTruthy();
    expect(screen.queryByText("Bitcoin")).toBeNull();
  });

  it("switches to the trending tab", () => {
    setupState({
      trending: {
        coins: [
          {
            id: "sol",
            name: "Solana",
            symbol: "SOL",
            market_cap_rank: 5,
            image: "/sol.png",
            price_btc: 0.001,
            score: 1,
            price: 100,
            price_change_24h: null,
            market_cap: "1B",
            total_volume: "10M",
            sparkline: "",
          },
        ],
      },
    });
    render(<TopGainersLosers onSymbolChange={vi.fn()} />);

    fireEvent.click(screen.getByText("Tendance 🔥"));
    expect(screen.getByText("Solana")).toBeTruthy();
    // price_change_24h null -> renders em dash
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows a loading message", () => {
    setupState({ topGainersLosers: { loading: true } });
    render(<TopGainersLosers onSymbolChange={vi.fn()} />);
    expect(screen.getByText("Chargement...")).toBeTruthy();
  });

  it("shows an error message", () => {
    setupState({ topGainersLosers: { error: "Failed to fetch data" } });
    render(<TopGainersLosers onSymbolChange={vi.fn()} />);
    expect(screen.getByText("Failed to fetch data")).toBeTruthy();
  });
});
