import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("@/app/lib/hooks", () => ({ useAppSelector: vi.fn() }));
vi.mock("@/app/context/Curency/CurrencyContext", () => ({
  useCurrency: () => ({ currency: "eur" }),
}));

import { useAppSelector } from "@/app/lib/hooks";
import Positions from "@/app/components/Simulation/Positions";

const coins = [
  {
    id: "btc",
    symbol: "btc",
    name: "Bitcoin",
    image: "",
    price: 110,
    market_cap: 1,
    change_24h: 0,
  },
];

function setup(holdings: unknown[]) {
  vi.mocked(useAppSelector).mockImplementation((selector) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selector({
      simulation: {
        balance: 0,
        initialBalance: 1000,
        realizedPnl: 0,
        holdings,
      },
      exchangeRate: { usdPerEur: null },
    } as any),
  );
}

describe("Positions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("invites to place a first order when there is no position", () => {
    setup([]);
    render(<Positions coins={coins} selectedId="" onSelect={vi.fn()} />);
    expect(screen.getByText(/Aucune position ouverte/)).toBeTruthy();
  });

  it("lists each position with its value and PnL", () => {
    setup([
      {
        coinId: "btc",
        coinName: "Bitcoin",
        coinSymbol: "btc",
        coinImage: "",
        amount: 5,
        avgBuyPrice: 100,
      },
    ]);
    render(<Positions coins={coins} selectedId="" onSelect={vi.fn()} />);
    const table = screen.getByRole("table", { name: "Positions ouvertes" });
    expect(within(table).getByText(/550,00\s€/)).toBeTruthy();
    expect(within(table).getByText(/\+50,00\s€/)).toBeTruthy();
    expect(within(table).getByText(/\+10,00\s%/)).toBeTruthy();
  });

  it("selects a position on click", () => {
    setup([
      {
        coinId: "btc",
        coinName: "Bitcoin",
        coinSymbol: "btc",
        coinImage: "",
        amount: 5,
        avgBuyPrice: 100,
      },
    ]);
    const onSelect = vi.fn();
    render(<Positions coins={coins} selectedId="" onSelect={onSelect} />);
    fireEvent.click(
      within(
        screen.getByRole("table", { name: "Positions ouvertes" }),
      ).getByRole("button", {
        name: "Bitcoin",
      }),
    );
    expect(onSelect).toHaveBeenCalledWith("btc");
  });
});
