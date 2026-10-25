import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../../../app/lib/hooks", () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
}));
vi.mock("../../../app/context/Curency/CurrencyContext", () => ({
  useCurrency: vi.fn(),
}));

import { useAppDispatch, useAppSelector } from "../../../app/lib/hooks";
import { useCurrency } from "../../../app/context/Curency/CurrencyContext";
import TradeForm from "../../../app/components/Simulation/TradeForm";

const coins = [
  { id: "btc", symbol: "btc", name: "Bitcoin", image: "/btc.png", price: 100, market_cap: 1, change_24h: 0 },
  { id: "eth", symbol: "eth", name: "Ethereum", image: "/eth.png", price: 50, market_cap: 1, change_24h: 0 },
];

function setupSelector(state: any) {
  vi.mocked(useAppSelector).mockImplementation((selector: any) => selector(state));
}

describe("TradeForm", () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(dispatch);
    vi.mocked(useCurrency).mockReturnValue({ currency: "usd", setCurrency: vi.fn() });
    setupSelector({
      simulation: { balance: 1000, holdings: [] },
      exchangeRate: { usdPerEur: 1.1 },
    });
  });

  it("disables submit until a coin and amount are selected", () => {
    const { container } = render(
      <TradeForm coins={coins} selectedId={null} handleSymbolChange={vi.fn()} />,
    );
    expect(
      (container.querySelector('button[type="submit"]') as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("dispatches a buy trade within the available balance", () => {
    render(<TradeForm coins={coins} selectedId="btc" handleSymbolChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Quantité"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Acheter du Bitcoin" }));

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ coinId: "btc", type: "buy", amount: 5 }),
      }),
    );
  });

  it("prevents buying more than the available balance", () => {
    render(<TradeForm coins={coins} selectedId="btc" handleSymbolChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Quantité"), { target: { value: "1000" } });

    expect((screen.getByRole("button", { name: "Acheter du Bitcoin" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Montant supérieur au solde disponible.")).toBeTruthy();
  });

  it("explains why buying is impossible with an empty balance", () => {
    setupSelector({
      simulation: { balance: 0, holdings: [] },
      exchangeRate: { usdPerEur: 1.1 },
    });
    render(<TradeForm coins={coins} selectedId="btc" handleSymbolChange={vi.fn()} />);

    expect(
      screen.getByText(
        "Solde insuffisant. Vendez une position ou réinitialisez le portefeuille.",
      ),
    ).toBeTruthy();
  });

  it("shows the coin icon and current price of the selected coin", () => {
    const { container } = render(
      <TradeForm coins={coins} selectedId="btc" handleSymbolChange={vi.fn()} />,
    );
    expect(container.querySelector('img[src*="btc.png"]')).toBeTruthy();
    expect(screen.getByText(/Prix actuel 100,00\s\$/)).toBeTruthy();
  });

  it("picks a coin from the list", () => {
    const handleSymbolChange = vi.fn();
    render(
      <TradeForm coins={coins} selectedId={null} handleSymbolChange={handleSymbolChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Crypto/ }));
    fireEvent.click(screen.getByRole("option", { name: /Ethereum/ }));
    expect(handleSymbolChange).toHaveBeenCalledWith("eth");
  });

  it("switches to sell mode and restricts to sellable coins", () => {
    setupSelector({
      simulation: {
        balance: 1000,
        holdings: [
          {
            coinId: "btc",
            coinName: "Bitcoin",
            coinSymbol: "btc",
            coinImage: "/btc.png",
            amount: 2,
            avgBuyPrice: 90,
          },
        ],
      },
      exchangeRate: { usdPerEur: null },
    });
    const handleSymbolChange = vi.fn();
    render(<TradeForm coins={coins} selectedId="eth" handleSymbolChange={handleSymbolChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Vendre" }));

    // eth isn't held, so switching to sell with a non-held coin clears the selection
    expect(handleSymbolChange).toHaveBeenCalledWith("");
  });

  it("fills the max sell amount from the current holding", () => {
    setupSelector({
      simulation: {
        balance: 1000,
        holdings: [
          {
            coinId: "btc",
            coinName: "Bitcoin",
            coinSymbol: "btc",
            coinImage: "/btc.png",
            amount: 2,
            avgBuyPrice: 90,
          },
        ],
      },
      exchangeRate: { usdPerEur: null },
    });
    render(<TradeForm coins={coins} selectedId="btc" handleSymbolChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Vendre" }));
    fireEvent.click(screen.getByText("Max"));

    expect((screen.getByLabelText("Quantité") as HTMLInputElement).value).toBe("2");
    expect(screen.getByRole("button", { name: /Vendre 2,000000 BTC/ })).toBeTruthy();
  });
});
