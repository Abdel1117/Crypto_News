import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../../app/lib/hooks", () => ({
  useAppSelector: vi.fn(),
}));

import { useAppSelector } from "../../../app/lib/hooks";
import PortfolioChart from "../../../app/components/Simulation/PortfolioChart";

const coins = [
  { id: "btc", symbol: "btc", name: "Bitcoin", image: "/btc.png", price: 100, market_cap: 1, change_24h: 0 },
];

function setupState(simulation: any) {
  vi.mocked(useAppSelector).mockImplementation((selector: any) => selector({ simulation }));
}

describe("PortfolioChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when there is no balance and no holdings", () => {
    setupState({ balance: 0, holdings: [] });
    const { container } = render(<PortfolioChart coins={coins} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a segment per holding plus cash", () => {
    setupState({
      balance: 500,
      holdings: [{ coinId: "btc", coinSymbol: "btc", amount: 5, avgBuyPrice: 100 }],
    });

    render(<PortfolioChart coins={coins} />);

    expect(screen.getByText("BTC")).toBeTruthy();
    expect(screen.getByText("Cash")).toBeTruthy();
  });
});
