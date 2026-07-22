import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("../../app/components/ThemeButton/ThemeButton", () => ({
  ThemeButton: () => <button>Theme</button>,
}));
vi.mock("../../app/components/ParamButton/ParamButton", () => ({
  ParamButton: () => <button>Param</button>,
}));
vi.mock("../../app/components/ProfileDropdown/ProfileDropdown", () => ({
  default: () => <div>ProfileDropdown</div>,
}));
vi.mock("../../app/context/Curency/CurrencyContext", () => ({
  useCurrency: vi.fn(),
}));
vi.mock("../../app/lib/hooks", () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
}));
vi.mock("../../app/lib/api/crypto", () => ({
  searchSymbols: vi.fn(),
}));

import { useCurrency } from "../../app/context/Curency/CurrencyContext";
import { useAppDispatch, useAppSelector } from "../../app/lib/hooks";
import { searchSymbols } from "../../app/lib/api/crypto";
import UserBar from "../../app/components/UserBar/UserBar";

describe("UserBar", () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(useCurrency).mockReturnValue({ currency: "usd", setCurrency: vi.fn() });
    vi.mocked(useAppDispatch).mockReturnValue(dispatch);
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({ auth: { isAuthenticated: false } }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the login link when unauthenticated", () => {
    render(<UserBar />);
    expect(screen.getByLabelText("Rechercher une crypto")).toBeTruthy();
    expect(screen.queryByText("ProfileDropdown")).toBeNull();
  });

  it("shows the ProfileDropdown when authenticated", () => {
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({ auth: { isAuthenticated: true } }),
    );
    render(<UserBar />);
    expect(screen.getByText("ProfileDropdown")).toBeTruthy();
  });

  it("opens the search panel with the initial hint", () => {
    render(<UserBar />);
    fireEvent.click(screen.getByLabelText("Rechercher une crypto"));

    expect(
      screen.getByText(/Commencez à taper un nom ou un symbole/),
    ).toBeTruthy();
  });

  it("searches after the debounce delay and shows results", async () => {
    vi.mocked(searchSymbols).mockResolvedValue([{ id: "sol", symbol: "sol", name: "Solana" }]);
    render(<UserBar />);
    fireEvent.click(screen.getByLabelText("Rechercher une crypto"));

    fireEvent.change(screen.getByPlaceholderText("Rechercher une crypto..."), {
      target: { value: "sol" },
    });
    expect(screen.getByText("Recherche en cours...")).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(searchSymbols).toHaveBeenCalledWith("sol");
    expect(screen.getByText("Solana")).toBeTruthy();
  });

  it("shows a not-found message when the search returns no results", async () => {
    vi.mocked(searchSymbols).mockResolvedValue([]);
    render(<UserBar />);
    fireEvent.click(screen.getByLabelText("Rechercher une crypto"));

    fireEvent.change(screen.getByPlaceholderText("Rechercher une crypto..."), {
      target: { value: "xyz" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByText("Aucune crypto trouvée pour «xyz».")).toBeTruthy();
  });

  it("shows an error message when the search fails", async () => {
    vi.mocked(searchSymbols).mockRejectedValue(new Error("Search failed badly"));
    render(<UserBar />);
    fireEvent.click(screen.getByLabelText("Rechercher une crypto"));

    fireEvent.change(screen.getByPlaceholderText("Rechercher une crypto..."), {
      target: { value: "xyz" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByText("Search failed badly")).toBeTruthy();
  });

  it("adds a result to the watchlist and closes the panel", async () => {
    vi.mocked(searchSymbols).mockResolvedValue([{ id: "sol", symbol: "sol", name: "Solana" }]);
    render(<UserBar />);
    fireEvent.click(screen.getByLabelText("Rechercher une crypto"));

    fireEvent.change(screen.getByPlaceholderText("Rechercher une crypto..."), {
      target: { value: "sol" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    fireEvent.click(screen.getByText("Ajouter"));

    expect(dispatch).toHaveBeenCalledTimes(3);
    expect(screen.queryByText("Solana")).toBeNull();
  });

  it("clears the query and results when closing the search via the toggle", () => {
    render(<UserBar />);
    fireEvent.click(screen.getByLabelText("Rechercher une crypto"));
    fireEvent.change(screen.getByPlaceholderText("Rechercher une crypto..."), {
      target: { value: "sol" },
    });

    fireEvent.click(screen.getByLabelText("Rechercher une crypto"));
    fireEvent.click(screen.getByLabelText("Rechercher une crypto"));

    expect(
      screen.getByText(/Commencez à taper un nom ou un symbole/),
    ).toBeTruthy();
  });
});
