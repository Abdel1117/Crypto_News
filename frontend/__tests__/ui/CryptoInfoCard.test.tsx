import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ src, alt, priority, ...props }: any) => (
    <img src={typeof src === "string" ? src : "img"} alt={alt} {...props} />
  ),
}));
vi.mock("../../app/context/Curency/CurrencyContext", () => ({
  useCurrency: vi.fn(),
}));
vi.mock("../../app/lib/hooks", () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
}));

import { useCurrency } from "../../app/context/Curency/CurrencyContext";
import { useAppDispatch, useAppSelector } from "../../app/lib/hooks";
import CryptoInfoCard from "../../app/ui/CryptoInfoCard/CryptoInfoCard";

const coin = {
  id: "btc",
  symbol: "btc",
  name: "Bitcoin",
  image: "/btc.png",
  price: 50000,
  change_24h: 2.5,
};

describe("CryptoInfoCard", () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCurrency).mockReturnValue({ currency: "usd", setCurrency: vi.fn() });
    vi.mocked(useAppDispatch).mockReturnValue(dispatch);
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({ watchlist: { ids: [] } }),
    );
  });

  it("renders the coin name, price and positive change", () => {
    render(<CryptoInfoCard coin={coin} selected={false} onSelect={() => {}} />);

    expect(screen.getByText("Bitcoin")).toBeTruthy();
    expect(screen.getByText("+2.5%")).toBeTruthy();
    expect(screen.getByText("(btc/USDT)")).toBeTruthy();
  });

  it("shows N/A and — when price/change are missing", () => {
    render(
      <CryptoInfoCard coin={{ id: "eth", symbol: "eth", name: "Ethereum" }} selected={false} onSelect={() => {}} />,
    );
    expect(screen.getByText("N/A")).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("calls onSelect when clicked", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <CryptoInfoCard coin={coin} selected={false} onSelect={onSelect} />,
    );

    fireEvent.click(container.querySelector('[role="button"]')!);
    expect(onSelect).toHaveBeenCalled();
  });

  it("toggles the watchlist without triggering onSelect", () => {
    const onSelect = vi.fn();
    render(<CryptoInfoCard coin={coin} selected={false} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Add to watchlist" }));

    expect(dispatch).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows the watchlist badge when the coin is already in the watchlist", () => {
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({ watchlist: { ids: ["btc"] } }),
    );
    render(<CryptoInfoCard coin={coin} selected={false} onSelect={() => {}} />);

    expect(screen.getAllByText("Dans vos favoris").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Remove from watchlist" })).toBeTruthy();
  });

  it("applies the selected ring style", () => {
    const { container } = render(<CryptoInfoCard coin={coin} selected={true} onSelect={() => {}} />);
    expect(container.firstChild).toHaveProperty("className", expect.stringContaining("ring-primary"));
  });
});
