import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/app/context/Curency/CurrencyContext", () => ({
  useCurrency: () => ({ currency: "eur", setCurrency: vi.fn() }),
}));

vi.mock("@/app/lib/hooks", () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
}));

vi.mock("@/app/hooks/useMediaQuery", () => ({
  useIsDesktop: vi.fn(() => true),
  useMediaQuery: vi.fn(() => true),
}));

vi.mock("@/app/lib/features/simulation/simulationSlice", () => ({
  initSimulation: vi.fn(() => ({ type: "simulation/initSimulation" })),
  resetSimulation: vi.fn(() => ({ type: "simulation/resetSimulation" })),
}));
vi.mock("@/app/lib/features/prices/pricesThunks", () => ({
  getPrices: vi.fn(() => ({ type: "prices/getPrices" })),
}));
vi.mock("@/app/lib/features/exchangeRate/exchangeRateThunks", () => ({
  getExchangeRate: vi.fn(() => ({ type: "exchangeRate/get" })),
}));

// The header slot renders in place so the reset button is reachable.
vi.mock("@/app/components/AppShell/HeaderSlots", () => ({
  HeaderActions: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="header-actions">{children}</div>
  ),
}));

vi.mock("@/app/components/Simulation/PortfolioSummary", () => ({
  default: ({ chart }: { chart?: React.ReactNode }) => (
    <div data-testid="portfolio-summary">{chart}</div>
  ),
}));
vi.mock("@/app/components/Simulation/PerformanceChart", () => ({
  default: ({ variant = "card" }: { variant?: string }) => (
    <div data-testid={`performance-chart-${variant}`} />
  ),
}));
vi.mock("@/app/components/Simulation/TradeForm", () => ({
  default: ({
    selectedId,
    inSheet,
  }: {
    selectedId: string | null;
    inSheet?: boolean;
  }) => (
    <div data-testid="trade-form" data-selected={selectedId ?? ""}>
      {inSheet ? "sheet" : "panel"}
    </div>
  ),
}));
vi.mock("@/app/components/Simulation/Positions", () => ({
  default: ({ onSelect }: { onSelect: (id: string) => void }) => (
    <button
      type="button"
      data-testid="positions"
      onClick={() => onSelect("btc")}
    >
      Positions
    </button>
  ),
}));
vi.mock("@/app/components/Simulation/TradeHistory", () => ({
  default: () => <div data-testid="trade-history" />,
}));
vi.mock("@/app/components/Simulation/OrderSheet", () => ({
  default: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? <div role="dialog">{children}</div> : null),
}));

import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import { useIsDesktop, useMediaQuery } from "@/app/hooks/useMediaQuery";
import SimulationPage from "../../../app/(app)/simulation/page";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SimulationPage", () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(dispatch);
    vi.mocked(useIsDesktop).mockReturnValue(true);
    vi.mocked(useMediaQuery).mockReturnValue(true);
    vi.mocked(useAppSelector).mockImplementation((selector) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selector({ prices: { coins: [] } } as any),
    );
  });

  it("initialises the portfolio, the exchange rate and the prices", () => {
    render(<SimulationPage />);
    expect(dispatch).toHaveBeenCalledWith({ type: "simulation/initSimulation" });
    expect(dispatch).toHaveBeenCalledWith({ type: "exchangeRate/get" });
    expect(dispatch).toHaveBeenCalledWith({ type: "prices/getPrices" });
  });

  describe("desktop", () => {
    it("shows the summary, one performance chart, positions, history and the order panel", () => {
      render(<SimulationPage />);
      expect(screen.getByTestId("portfolio-summary")).toBeTruthy();
      expect(screen.getByTestId("performance-chart-card")).toBeTruthy();
      expect(screen.queryByTestId("performance-chart-compact")).toBeNull();
      expect(screen.getByTestId("positions")).toBeTruthy();
      expect(screen.getByTestId("trade-history")).toBeTruthy();
      expect(screen.getByTestId("trade-form").textContent).toBe("panel");
    });

    it("loads a position in the order form", () => {
      render(<SimulationPage />);
      fireEvent.click(screen.getByTestId("positions"));
      expect(screen.getByTestId("trade-form").dataset.selected).toBe("btc");
    });
  });

  describe("mobile", () => {
    beforeEach(() => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      vi.mocked(useMediaQuery).mockReturnValue(false);
    });

    it("puts the chart in the summary card and the form in a bottom sheet", () => {
      render(<SimulationPage />);
      expect(screen.getByTestId("performance-chart-compact")).toBeTruthy();
      expect(screen.queryByTestId("performance-chart-card")).toBeNull();
      expect(screen.queryByTestId("trade-form")).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: "Passer un ordre" }));
      expect(screen.getByRole("dialog").textContent).toBe("sheet");
    });

    it("opens the sheet on the tapped position", () => {
      render(<SimulationPage />);
      fireEvent.click(screen.getByTestId("positions"));
      expect(screen.getByTestId("trade-form").dataset.selected).toBe("btc");
    });
  });

  describe("reset", () => {
    const reset = () =>
      fireEvent.click(
        screen.getByRole("button", { name: "Réinitialiser le portefeuille" }),
      );

    it("asks for confirmation then resets", () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      render(<SimulationPage />);
      reset();
      expect(window.confirm).toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith({
        type: "simulation/resetSimulation",
      });
    });

    it("does nothing when the user cancels", () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);
      render(<SimulationPage />);
      reset();
      expect(dispatch).not.toHaveBeenCalledWith({
        type: "simulation/resetSimulation",
      });
    });
  });
});
