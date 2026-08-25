import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// ─── External dependency mocks ────────────────────────────────────────────────

vi.mock("@/app/lib/ws/socket", () => ({ send: vi.fn() }));

vi.mock("@/app/lib/features/prices/pricesThunks", () => ({
  getMarketCoin: vi.fn(() => ({ type: "prices/getMarketCoin" })),
}));
vi.mock("@/app/lib/features/marketView/marketViewSlice", () => ({
  setSelectedSymbol: vi.fn((id: string) => ({
    type: "marketView/setSelectedSymbol",
    payload: id,
  })),
}));
vi.mock("@/app/lib/features/symbol/symbolSlice", () => ({
  addSymbolIfMissing: vi.fn(() => ({ type: "symbols/addSymbolIfMissing" })),
}));
vi.mock("@/app/lib/features/watchlist/watchlistSlice", () => ({
  initWatchlist: vi.fn(() => ({ type: "watchlist/initWatchlist" })),
  toggleWatchlist: vi.fn(() => ({ type: "watchlist/toggleWatchlist" })),
}));

// ─── Context / store mocks ────────────────────────────────────────────────────

vi.mock("@/app/context/Curency/CurrencyContext", () => ({
  useCurrency: () => ({ currency: "eur", setCurrency: vi.fn() }),
}));

vi.mock("@/app/lib/hooks", () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
}));

// ─── Heavy component mocks ────────────────────────────────────────────────────

vi.mock("@/app/ui/CryptoInfoCard/CryptoInfoCard", () => ({
  default: ({ coin }: { coin: { id: string; name: string } }) => (
    <div data-testid="crypto-info-card" data-id={coin.id}>
      {coin.name}
    </div>
  ),
}));
vi.mock("@/app/components/CandleStickGraph/CandleStickGraph", () => ({
  default: () => <div data-testid="candlestick-graph">CandleStickGraph</div>,
}));
vi.mock("@/app/components/TopGainersLosers/TopGainersLosers", () => ({
  default: () => (
    <div data-testid="top-gainers-losers">TopGainersLosers</div>
  ),
}));
vi.mock("@/app/components/MarketOverView/MarketOverView", () => ({
  default: () => <div data-testid="market-overview">MarketOverView</div>,
}));

import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import DashboardPage from "../../../app/(app)/dashboard/page";

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const mockCoinA = { id: "bitcoin",  name: "Bitcoin",  symbol: "btc" };
const mockCoinB = { id: "ethereum", name: "Ethereum", symbol: "eth" };

const defaultState = {
  prices:           { coins: [], loading: false },
  symbols:          { symbols: [] },
  topGainersLosers: { topGainers: [], topLosers: [] },
  trending:         { coins: [] },
  watchlist:        { ids: [] },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("DashboardPage", () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(mockDispatch);
    vi.mocked(useAppSelector).mockImplementation((selector) =>
      selector(defaultState as any),
    );
  });

  describe("static structure", () => {
    it("renders without crashing", () => {
      const { container } = render(<DashboardPage />);
      expect(container.firstChild).toBeTruthy();
    });

    it("always renders MarketOverView", () => {
      render(<DashboardPage />);
      expect(screen.getByTestId("market-overview")).toBeTruthy();
    });

    it("always renders CandleStickGraph", () => {
      render(<DashboardPage />);
      expect(screen.getByTestId("candlestick-graph")).toBeTruthy();
    });

    it("always renders TopGainersLosers", () => {
      render(<DashboardPage />);
      expect(screen.getByTestId("top-gainers-losers")).toBeTruthy();
    });
  });

  describe("effects on mount", () => {
    it("dispatches initWatchlist", () => {
      render(<DashboardPage />);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "watchlist/initWatchlist",
      });
    });
  });

  describe("loading state", () => {
    it("shows 6 coin-card skeletons plus the heatmap skeleton when prices.loading is true", () => {
      vi.mocked(useAppSelector).mockImplementation((selector) =>
        selector({ ...defaultState, prices: { coins: [], loading: true } } as any),
      );
      const { container } = render(<DashboardPage />);
      // 6 CryptoInfoCard skeletons + 1 HeatMap skeleton (real component, not mocked).
      expect(container.querySelectorAll(".animate-pulse").length).toBe(7);
    });

    it("shows no loading skeletons when prices.loading is false", () => {
      const { container } = render(<DashboardPage />);
      expect(container.querySelectorAll(".animate-pulse").length).toBe(0);
    });
  });

  describe("top crypto grid", () => {
    it("renders a CryptoInfoCard for each top coin", () => {
      vi.mocked(useAppSelector).mockImplementation((selector) =>
        selector({
          ...defaultState,
          prices: { coins: [mockCoinA, mockCoinB], loading: false },
        } as any),
      );
      render(<DashboardPage />);
      expect(screen.getAllByTestId("crypto-info-card").length).toBe(2);
    });

    it("renders no CryptoInfoCards when coins list is empty", () => {
      render(<DashboardPage />);
      expect(screen.queryAllByTestId("crypto-info-card")).toHaveLength(0);
    });

    it("limits the top crypto grid to 6 coins", () => {
      const manyCoins = Array.from({ length: 10 }, (_, i) => ({
        id: `coin-${i}`,
        name: `Coin ${i}`,
        symbol: `c${i}`,
      }));
      vi.mocked(useAppSelector).mockImplementation((selector) =>
        selector({
          ...defaultState,
          prices: { coins: manyCoins, loading: false },
        } as any),
      );
      render(<DashboardPage />);
      expect(screen.getAllByTestId("crypto-info-card").length).toBe(6);
    });
  });

  describe("watchlist section", () => {
    it("hides the watchlist heading when watchlist is empty", () => {
      render(<DashboardPage />);
      expect(screen.queryByText(/your watchlist/i)).toBeNull();
    });

    it("shows the watchlist heading when matching coins exist", () => {
      vi.mocked(useAppSelector).mockImplementation((selector) =>
        selector({
          ...defaultState,
          prices: { coins: [mockCoinA], loading: false },
          watchlist: { ids: ["bitcoin"] },
        } as any),
      );
      render(<DashboardPage />);
      expect(screen.getByText("Your Watchlist")).toBeTruthy();
    });

    it("renders one CryptoInfoCard per watchlist coin", () => {
      vi.mocked(useAppSelector).mockImplementation((selector) =>
        selector({
          ...defaultState,
          prices: { coins: [mockCoinA, mockCoinB], loading: false },
          watchlist: { ids: ["bitcoin", "ethereum"] },
        } as any),
      );
      render(<DashboardPage />);
      // 2 watchlist cards + 2 top-crypto cards = 4
      expect(screen.getAllByTestId("crypto-info-card").length).toBe(4);
    });

    it("silently skips watchlist IDs not found in price or symbol maps", () => {
      vi.mocked(useAppSelector).mockImplementation((selector) =>
        selector({
          ...defaultState,
          prices: { coins: [mockCoinA], loading: false },
          watchlist: { ids: ["bitcoin", "unknown-xyz"] },
        } as any),
      );
      render(<DashboardPage />);
      // 1 watchlist card (bitcoin) + 1 top-crypto card = 2
      expect(screen.getAllByTestId("crypto-info-card").length).toBe(2);
    });
  });
});
