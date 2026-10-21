import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

// ─── External dependency mocks ────────────────────────────────────────────────

vi.mock("@/app/lib/ws/socket", () => ({ send: vi.fn() }));

vi.mock("@/app/lib/features/prices/pricesThunks", () => ({
  getMarketCoin: vi.fn((args: { cryptoId: string }) => ({
    type: "prices/getMarketCoin",
    payload: args.cryptoId,
  })),
}));
vi.mock("@/app/lib/features/marketView/marketViewSlice", () => ({
  setSelectedSymbol: vi.fn((id: string) => ({
    type: "marketView/setSelectedSymbol",
    payload: id,
  })),
}));
vi.mock("@/app/lib/features/symbol/symbolSlice", () => ({
  addSymbolIfMissing: vi.fn((coin: { id: string }) => ({
    type: "symbols/addSymbolIfMissing",
    payload: coin,
  })),
}));
vi.mock("@/app/lib/features/watchlist/watchlistSlice", () => ({
  initWatchlist: vi.fn(() => ({ type: "watchlist/initWatchlist" })),
}));

vi.mock("@/app/context/Curency/CurrencyContext", () => ({
  useCurrency: () => ({ currency: "eur", setCurrency: vi.fn() }),
}));

vi.mock("@/app/lib/hooks", () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
}));

// ─── Section mocks (each section has its own tests) ───────────────────────────

type Coin = { id: string; name: string };

vi.mock("@/app/components/Dashboard/Favorites", () => ({
  default: ({
    coins,
    selectedId,
    onSelect,
  }: {
    coins: Coin[];
    selectedId: string;
    onSelect: (id: string) => void;
  }) => (
    <section data-testid="favorites" data-selected={selectedId}>
      {coins.map((c) => (
        <button key={c.id} type="button" onClick={() => onSelect(c.id)}>
          fav-{c.id}
        </button>
      ))}
    </section>
  ),
}));
vi.mock("@/app/components/Dashboard/PriceChart", () => ({
  default: ({ coin }: { coin?: Coin }) => (
    <section data-testid="price-chart">{coin?.name ?? "none"}</section>
  ),
}));
vi.mock("@/app/components/Dashboard/MarketStats", () => ({
  default: () => <section data-testid="market-stats" />,
}));
vi.mock("@/app/components/Dashboard/HeatmapPreview", () => ({
  default: ({ onSelect }: { onSelect: (id: string) => void }) => (
    <button
      type="button"
      data-testid="heatmap-preview"
      onClick={() => onSelect("solana")}
    >
      heatmap
    </button>
  ),
}));
vi.mock("@/app/components/Dashboard/MoversTable", () => ({
  default: () => <section data-testid="movers-table" />,
}));

import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import DashboardPage from "../../../app/(app)/dashboard/page";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const bitcoin = { id: "bitcoin", name: "Bitcoin", symbol: "btc", image: "" };
const ethereum = { id: "ethereum", name: "Ethereum", symbol: "eth", image: "" };
const solana = { id: "solana", name: "Solana", symbol: "sol", image: "" };

const baseState = {
  prices: { coins: [bitcoin, ethereum], loading: false },
  symbols: { symbols: [] as { id: string }[] },
  topGainersLosers: { topGainers: [solana], topLosers: [] },
  trending: { coins: [] },
  watchlist: { ids: [] as string[] },
  marketView: { selectedSymbol: "bitcoin" },
};

function withState(patch: Partial<typeof baseState>) {
  const state = { ...baseState, ...patch };
  vi.mocked(useAppSelector).mockImplementation((selector) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selector(state as any),
  );
}

describe("DashboardPage", () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(dispatch);
    withState({});
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
  });

  it("renders every section", () => {
    render(<DashboardPage />);
    for (const id of [
      "favorites",
      "price-chart",
      "market-stats",
      "heatmap-preview",
      "movers-table",
    ]) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
  });

  it("initialises the watchlist on mount", () => {
    render(<DashboardPage />);
    expect(dispatch).toHaveBeenCalledWith({ type: "watchlist/initWatchlist" });
  });

  it("passes the watchlist coins to Favorites, skipping unknown ids", () => {
    withState({ watchlist: { ids: ["ethereum", "unknown-xyz"] } });
    render(<DashboardPage />);
    expect(screen.getByText("fav-ethereum")).toBeTruthy();
    expect(screen.queryByText("fav-unknown-xyz")).toBeNull();
  });

  it("fetches market data for favourites missing from the price feed", () => {
    withState({ watchlist: { ids: ["ethereum", "cardano"] } });
    render(<DashboardPage />);
    expect(dispatch).toHaveBeenCalledWith({
      type: "prices/getMarketCoin",
      payload: "cardano",
    });
    expect(dispatch).not.toHaveBeenCalledWith({
      type: "prices/getMarketCoin",
      payload: "ethereum",
    });
  });

  it("shows the selected coin in the chart", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("price-chart").textContent).toBe("Bitcoin");
    expect(screen.getByTestId("favorites").dataset.selected).toBe("bitcoin");
  });

  it("selects a coin from a favourite card", () => {
    withState({ watchlist: { ids: ["ethereum"] } });
    render(<DashboardPage />);
    fireEvent.click(screen.getByText("fav-ethereum"));
    expect(dispatch).toHaveBeenCalledWith({
      type: "marketView/setSelectedSymbol",
      payload: "ethereum",
    });
  });

  it("registers coins picked outside the price feed as symbols", () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByTestId("heatmap-preview"));
    expect(dispatch).toHaveBeenCalledWith({
      type: "marketView/setSelectedSymbol",
      payload: "solana",
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: "symbols/addSymbolIfMissing",
      payload: {
        id: "solana",
        name: "Solana",
        symbol: "sol",
        image: "",
      },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: "prices/getMarketCoin",
      payload: "solana",
    });
  });
});
