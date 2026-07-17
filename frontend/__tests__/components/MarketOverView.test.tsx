import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("../../app/context/Curency/CurrencyContext", () => ({
  useCurrency: vi.fn(),
}));
vi.mock("../../app/lib/api/crypto", () => ({
  getMarketView: vi.fn(),
}));

import { useCurrency } from "../../app/context/Curency/CurrencyContext";
import { getMarketView } from "../../app/lib/api/crypto";
import MarketOverView from "../../app/components/MarketOverView/MarketOverView";

describe("MarketOverView", () => {
  beforeEach(() => {
    vi.mocked(useCurrency).mockReturnValue({ currency: "usd", setCurrency: vi.fn() });
  });

  it("renders the market stats once the data resolves", async () => {
    vi.mocked(getMarketView).mockResolvedValue({
      total_market_cap: 1000000,
      total_volume: 500000,
      market_cap_percentage: 52.3,
      market_cap_change_percentage_24h: 1.2,
      volume_change_percentage_24h: -3.4,
    });

    render(<MarketOverView />);

    await waitFor(() => {
      expect(screen.getByText("1 000 000$")).toBeTruthy();
    });
    expect(screen.getByText("+1.20%")).toBeTruthy();
    expect(screen.getByText("-3.40%")).toBeTruthy();
    expect(screen.getByText("+52.30%")).toBeTruthy();
  });

  it("does not crash when the api returns no data", async () => {
    vi.mocked(getMarketView).mockResolvedValue(null);

    render(<MarketOverView />);

    await waitFor(() => {
      expect(screen.getByText("Market Cap")).toBeTruthy();
    });
    expect(screen.getAllByText("0.00%").length).toBe(3);
  });
});
