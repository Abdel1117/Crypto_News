import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("@/app/lib/hooks", () => ({ useAppDispatch: vi.fn() }));
vi.mock("@/app/context/Curency/CurrencyContext", () => ({
  useCurrency: () => ({ currency: "eur" }),
}));
vi.mock("@/app/lib/features/marketView/marketViewSlice", () => ({
  setSelectedSymbol: vi.fn((id: string) => ({
    type: "marketView/setSelectedSymbol",
    payload: id,
  })),
}));
vi.mock("@/app/hooks/useDenseMarketHeatmap", () => ({
  useDenseMarketHeatmap: vi.fn(),
}));
vi.mock("@/app/components/AppShell/HeaderSlots", () => ({
  HeaderActions: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="header-actions">{children}</div>
  ),
  HeaderTitleExtra: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="header-title">{children}</div>
  ),
}));
vi.mock("@/app/components/HeatMap/MarketTreemap", () => ({
  HEATMAP_SCALE: 9,
  tileBackground: () => "grey",
  default: ({
    coins,
    onSelect,
  }: {
    coins: { id: string; symbol: string }[];
    onSelect: (id: string) => void;
  }) => (
    <div data-testid="treemap">
      {coins.map((c) => (
        <button key={c.id} type="button" onClick={() => onSelect(c.id)}>
          {c.symbol}
        </button>
      ))}
    </div>
  ),
}));

import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/app/lib/hooks";
import { useDenseMarketHeatmap } from "@/app/hooks/useDenseMarketHeatmap";
import HeatmapPage from "../../../app/(app)/heatmap/page";

const coins = [
  { id: "bitcoin", symbol: "btc", name: "Bitcoin", market_cap: 3 },
  { id: "tether", symbol: "usdt", name: "Tether", market_cap: 2 },
];

describe("HeatmapPage", () => {
  const dispatch = vi.fn();
  const push = vi.fn();
  const refresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(dispatch);
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<
      typeof useRouter
    >);
    vi.mocked(useDenseMarketHeatmap).mockReturnValue({
      data: coins as never,
      loading: false,
      error: null,
      updatedAt: new Date(2026, 9, 21, 14, 32).getTime(),
      refresh,
    });
  });

  it("asks for the top 50 in the current currency", () => {
    render(<HeatmapPage />);
    expect(useDenseMarketHeatmap).toHaveBeenCalledWith("eur", 50);
  });

  it("hides stablecoins by default and can show them", () => {
    render(<HeatmapPage />);
    expect(screen.getByText("btc")).toBeTruthy();
    expect(screen.queryByText("usdt")).toBeNull();

    const [toggle] = screen.getAllByRole("checkbox", {
      name: "Masquer les stablecoins",
    });
    fireEvent.click(toggle);
    expect(screen.getByText("usdt")).toBeTruthy();
  });

  it("shows the update time and refreshes on demand", () => {
    render(<HeatmapPage />);
    expect(screen.getByText("Mis à jour à 14:32")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Actualiser la heatmap" }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("opens the coin's chart on the dashboard", () => {
    render(<HeatmapPage />);
    fireEvent.click(screen.getByText("btc"));
    expect(dispatch).toHaveBeenCalledWith({
      type: "marketView/setSelectedSymbol",
      payload: "bitcoin",
    });
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("shows the error with a retry", () => {
    vi.mocked(useDenseMarketHeatmap).mockReturnValue({
      data: [],
      loading: false,
      error: "Réseau indisponible",
      updatedAt: null,
      refresh,
    });
    render(<HeatmapPage />);
    expect(screen.getByText("Réseau indisponible")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the colour legend", () => {
    render(<HeatmapPage />);
    expect(screen.getByText("Taille des cases : capitalisation")).toBeTruthy();
  });
});
