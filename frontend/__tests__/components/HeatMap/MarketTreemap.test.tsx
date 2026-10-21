import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import MarketTreemap, {
  tileBackground,
} from "@/app/components/HeatMap/MarketTreemap";

// jsdom has no layout: give the treemap a 1000 × 600 box.
globalThis.ResizeObserver = class {
  private cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe() {
    this.cb(
      [{ contentRect: { width: 1000, height: 600 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
  disconnect() {}
} as unknown as typeof ResizeObserver;

const coins = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "https://coin-images.coingecko.com/btc.png",
    price: 74273,
    market_cap: 1.42e12,
    change_24h: 2.26,
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    image: "https://coin-images.coingecko.com/eth.png",
    price: 3418,
    market_cap: 4.12e11,
    change_24h: 3.33,
  },
  {
    id: "tron",
    symbol: "trx",
    name: "TRON",
    image: "",
    price: 0.29,
    market_cap: 2.7e10,
    change_24h: -0.62,
  },
  {
    id: "tiny",
    symbol: "tiny",
    name: "Tiny",
    image: "",
    price: 1,
    market_cap: 1e6,
    change_24h: 1,
  },
];

describe("MarketTreemap", () => {
  beforeEach(() => vi.clearAllMocks());

  it("draws one tile per coin with a descriptive label", () => {
    render(<MarketTreemap coins={coins} currency="eur" onSelect={vi.fn()} />);
    expect(
      screen.getByRole("button", {
        name: /^Bitcoin \(BTC\) : \+2,26\s% sur 24 h/,
      }),
    ).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  it("keeps the coin icon on large tiles and hides labels on tiny ones", () => {
    const { container } = render(
      <MarketTreemap coins={coins} currency="eur" onSelect={vi.fn()} />,
    );
    expect(container.querySelector('img[src*="btc.png"]')).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Tiny/ }).textContent).toBe("");
  });

  it("shows price, change and cap on hover", () => {
    render(<MarketTreemap coins={coins} currency="eur" onSelect={vi.fn()} />);
    fireEvent.mouseEnter(screen.getByRole("button", { name: /^Ethereum/ }));
    expect(screen.getByText("Cliquer pour ouvrir le graphique")).toBeTruthy();
    expect(screen.getByText(/3\s418,00\s€/)).toBeTruthy();
    expect(screen.getByText(/412\sMd\s€/)).toBeTruthy();
  });

  it("opens the coin on click", () => {
    const onSelect = vi.fn();
    render(<MarketTreemap coins={coins} currency="eur" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /^TRON/ }));
    expect(onSelect).toHaveBeenCalledWith("tron");
  });

  it("colours tiles by the size of the move", () => {
    expect(tileBackground(9)).toContain("var(--n-up) 60%");
    expect(tileBackground(-20)).toContain("var(--n-down) 60%");
    expect(tileBackground(0)).toContain("12%");
  });
});
