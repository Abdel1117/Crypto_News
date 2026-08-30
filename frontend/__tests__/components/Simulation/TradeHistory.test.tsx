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
import TradeHistory from "../../../app/components/Simulation/TradeHistory";

describe("TradeHistory", () => {
  beforeEach(() => {
    vi.mocked(useCurrency).mockReturnValue({ currency: "usd", setCurrency: vi.fn() });
  });

  it("shows a placeholder when there are no trades", () => {
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({ simulation: { trades: [] }, exchangeRate: { usdPerEur: null } }),
    );
    render(<TradeHistory />);
    expect(screen.getByText("Aucune transaction pour le moment.")).toBeTruthy();
  });

  it("renders a row per trade with buy/sell labeling", () => {
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({
        exchangeRate: { usdPerEur: null },
        simulation: {
          trades: [
            {
              id: "1",
              coinId: "btc",
              coinName: "Bitcoin",
              coinSymbol: "btc",
              coinImage: "/btc.png",
              type: "buy",
              amount: 1.5,
              priceAtTrade: 100,
              total: 150,
              date: "2024-01-01T10:00:00.000Z",
            },
            {
              id: "2",
              coinId: "eth",
              coinName: "Ethereum",
              coinSymbol: "eth",
              coinImage: "/eth.png",
              type: "sell",
              amount: 2,
              priceAtTrade: 50,
              total: 100,
              date: "2024-01-02T10:00:00.000Z",
            },
          ],
        },
      }),
    );

    render(<TradeHistory />);

    expect(screen.getByText("Achat")).toBeTruthy();
    expect(screen.getByText("Vente")).toBeTruthy();
    expect(screen.getByText("Bitcoin")).toBeTruthy();
    expect(screen.getByText("Ethereum")).toBeTruthy();
  });
});
