import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../../app/lib/hooks", () => ({
  useAppSelector: vi.fn(),
}));
vi.mock("../../../app/context/Curency/CurrencyContext", () => ({
  useCurrency: vi.fn(),
}));
vi.mock("next/image", () => ({
  default: ({ src, alt, priority, ...props }: any) => (
    <img src={typeof src === "string" ? src : "img"} alt={alt} {...props} />
  ),
}));

import { useAppSelector } from "../../../app/lib/hooks";
import { useCurrency } from "../../../app/context/Curency/CurrencyContext";
import PortfolioSummary from "../../../app/components/Simulation/PortfolioSummary";

const coins = [
  { id: "btc", symbol: "btc", name: "Bitcoin", image: "/btc.png", price: 110, market_cap: 1, change_24h: 0 },
];

function setupState(simulation: any, pricesLoading = false) {
  vi.mocked(useAppSelector).mockImplementation((selector: any) =>
    selector({
      simulation,
      prices: { loading: pricesLoading },
      exchangeRate: { usdPerEur: null },
    }),
  );
}

describe("PortfolioSummary", () => {
  beforeEach(() => {
    vi.mocked(useCurrency).mockReturnValue({ currency: "usd", setCurrency: vi.fn() });
  });

  it("shows a positive total pnl when holdings gained value", () => {
    setupState({
      balance: 500,
      initialBalance: 1000,
      realizedPnl: 0,
      holdings: [{ coinId: "btc", coinName: "Bitcoin", coinSymbol: "btc", coinImage: "/btc.png", amount: 5, avgBuyPrice: 100 }],
    });

    render(<PortfolioSummary coins={coins} />);

    // totalValue = 500 + 5*110 = 1050, pnl = +50 (+5.00%)
    expect(screen.getByText(/\+50,00\$ \(5\.00%\)/)).toBeTruthy();
    expect(screen.getByText("Bitcoin")).toBeTruthy();
  });

  it("shows no positions section when there are no holdings", () => {
    setupState({ balance: 1000, initialBalance: 1000, realizedPnl: 0, holdings: [] });

    render(<PortfolioSummary coins={coins} />);

    expect(screen.queryByText("Vos positions")).toBeNull();
  });
});
