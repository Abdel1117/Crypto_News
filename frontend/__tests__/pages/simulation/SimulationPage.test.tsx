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

vi.mock("@/app/lib/features/simulation/simulationSlice", () => ({
  initSimulation: vi.fn(() => ({ type: "simulation/initSimulation" })),
  resetSimulation: vi.fn(() => ({ type: "simulation/resetSimulation" })),
}));

vi.mock("@/app/lib/features/prices/pricesThunks", () => ({
  getPrices: vi.fn(() => ({ type: "prices/getPrices" })),
}));

// Sub-component mocks — avoids pulling in charts, Redux, etc.
vi.mock("@/app/components/Simulation/PortfolioSummary", () => ({
  default: () => <div data-testid="portfolio-summary">PortfolioSummary</div>,
}));
vi.mock("@/app/components/Simulation/PerformanceChart", () => ({
  default: () => <div data-testid="performance-chart">PerformanceChart</div>,
}));
vi.mock("@/app/components/Simulation/TradeForm", () => ({
  default: () => <div data-testid="trade-form">TradeForm</div>,
}));
vi.mock("@/app/components/Simulation/PortfolioChart", () => ({
  default: () => <div data-testid="portfolio-chart">PortfolioChart</div>,
}));
vi.mock("@/app/components/Simulation/WithdrawalForm", () => ({
  default: () => <div data-testid="withdrawal-form">WithdrawalForm</div>,
}));
vi.mock("@/app/components/Simulation/TradeHistory", () => ({
  default: () => <div data-testid="trade-history">TradeHistory</div>,
}));
vi.mock("@/app/components/CandleStickGraph/CandleStickGraph", () => ({
  default: () => <div data-testid="candlestick-graph">CandleStickGraph</div>,
}));

import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import SimulationPage from "../../../app/(app)/simulation/page";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SimulationPage", () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(mockDispatch);
    vi.mocked(useAppSelector).mockImplementation((selector) =>
      selector({
        prices: { coins: [] },
        symbols: { symbols: [] },
        topGainersLosers: { topGainers: [], topLosers: [] },
        trending: { coins: [] },
      } as any),
    );
  });

  describe("structure", () => {
    it("renders without crashing", () => {
      const { container } = render(<SimulationPage />);
      expect(container.firstChild).toBeTruthy();
    });

    it("renders the page heading 'Portefeuille virtuel'", () => {
      render(<SimulationPage />);
      expect(
        screen.getByRole("heading", { name: "Portefeuille virtuel" }),
      ).toBeTruthy();
    });

    it("renders the reset button", () => {
      render(<SimulationPage />);
      expect(
        screen.getByRole("button", { name: /réinitialiser/i }),
      ).toBeTruthy();
    });

    it("renders PortfolioSummary", () => {
      render(<SimulationPage />);
      expect(screen.getByTestId("portfolio-summary")).toBeTruthy();
    });

    it("renders PerformanceChart", () => {
      render(<SimulationPage />);
      expect(screen.getByTestId("performance-chart")).toBeTruthy();
    });

    it("renders TradeForm", () => {
      render(<SimulationPage />);
      expect(screen.getByTestId("trade-form")).toBeTruthy();
    });

    it("renders PortfolioChart", () => {
      render(<SimulationPage />);
      expect(screen.getByTestId("portfolio-chart")).toBeTruthy();
    });

    it("renders TradeHistory", () => {
      render(<SimulationPage />);
      expect(screen.getByTestId("trade-history")).toBeTruthy();
    });
  });

  describe("effects on mount", () => {
    it("dispatches initSimulation", () => {
      render(<SimulationPage />);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "simulation/initSimulation",
      });
    });

    it("dispatches getPrices with the current currency", () => {
      render(<SimulationPage />);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "prices/getPrices",
      });
    });
  });

  describe("reset button", () => {
    it("shows a confirmation dialog when reset is clicked", () => {
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
      render(<SimulationPage />);
      fireEvent.click(screen.getByRole("button", { name: /réinitialiser/i }));
      expect(confirmSpy).toHaveBeenCalledOnce();
    });

    it("dispatches resetSimulation when the user confirms", () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      render(<SimulationPage />);
      fireEvent.click(screen.getByRole("button", { name: /réinitialiser/i }));
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "simulation/resetSimulation",
      });
    });

    it("does NOT dispatch resetSimulation when the user cancels", () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);
      render(<SimulationPage />);
      fireEvent.click(screen.getByRole("button", { name: /réinitialiser/i }));
      expect(mockDispatch).not.toHaveBeenCalledWith({
        type: "simulation/resetSimulation",
      });
    });
  });
});
