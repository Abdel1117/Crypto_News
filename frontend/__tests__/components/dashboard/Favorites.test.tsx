import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("@/app/lib/hooks", () => ({ useAppDispatch: vi.fn() }));
vi.mock("@/app/context/Curency/CurrencyContext", () => ({
  useCurrency: () => ({ currency: "eur" }),
}));
vi.mock("@/app/lib/features/watchlist/watchlistSlice", () => ({
  toggleWatchlist: vi.fn((id: string) => ({
    type: "watchlist/toggle",
    payload: id,
  })),
}));

import { useAppDispatch } from "@/app/lib/hooks";
import Favorites from "@/app/components/Dashboard/Favorites";
import { AppSearchContext } from "@/app/components/AppShell/SearchContext";

const coins = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "btc",
    image: "https://coin-images.coingecko.com/btc.png",
    price: 72050,
    change_24h: -0.87,
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "sol",
    price: 128.4,
    change_24h: 1.82,
  },
];

function renderFavorites(
  props: Partial<React.ComponentProps<typeof Favorites>> = {},
) {
  const openSearch = vi.fn();
  const onSelect = vi.fn();
  render(
    <AppSearchContext.Provider value={{ openSearch }}>
      <Favorites
        coins={coins}
        selectedId="bitcoin"
        onSelect={onSelect}
        {...props}
      />
    </AppSearchContext.Provider>,
  );
  return { openSearch, onSelect };
}

describe("Favorites", () => {
  const dispatch = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(dispatch);
  });

  it("shows the coin's own icon, falling back to a monogram", () => {
    const { container } = render(
      <AppSearchContext.Provider value={{ openSearch: vi.fn() }}>
        <Favorites coins={coins} selectedId="" onSelect={vi.fn()} />
      </AppSearchContext.Provider>,
    );
    const imgs = Array.from(container.querySelectorAll("img"));
    expect(
      imgs.some((img) => img.getAttribute("src")?.includes("btc.png")),
    ).toBe(true);
    expect(screen.getAllByText("S").length).toBeGreaterThan(0);
  });

  it("formats prices and changes in French", () => {
    renderFavorites();
    expect(screen.getAllByText(/72\s050,00\s€/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/−0,87\s%/).length).toBeGreaterThan(0);
  });

  it("marks the selected coin and selects another on click", () => {
    const { onSelect } = renderFavorites();
    const [btcCard] = screen.getAllByRole("button", {
      name: "Afficher Bitcoin dans le graphique",
    });
    expect(btcCard.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Afficher Solana dans le graphique",
      })[0],
    );
    expect(onSelect).toHaveBeenCalledWith("solana");
  });

  it("removes a coin from the favourites with the star", () => {
    renderFavorites();
    fireEvent.click(
      screen.getByRole("button", { name: "Retirer Solana des favoris" }),
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: "watchlist/toggle",
      payload: "solana",
    });
  });

  it("opens the search from « Ajouter »", () => {
    const { openSearch } = renderFavorites();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    expect(openSearch).toHaveBeenCalled();
  });

  it("invites to add favourites when there are none", () => {
    const { openSearch } = renderFavorites({ coins: [] });
    fireEvent.click(
      screen.getByRole("button", { name: "Rechercher une crypto" }),
    );
    expect(openSearch).toHaveBeenCalled();
  });
});
