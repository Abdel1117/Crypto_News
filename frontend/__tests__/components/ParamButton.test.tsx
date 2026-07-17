import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../../app/context/Curency/CurrencyContext", () => ({
  useCurrency: vi.fn(),
}));

import { useCurrency } from "../../app/context/Curency/CurrencyContext";
import { ParamButton } from "../../app/components/ParamButton/ParamButton";

describe("ParamButton", () => {
  it("opens the currency menu and selects a currency", () => {
    const setCurrency = vi.fn();
    vi.mocked(useCurrency).mockReturnValue({ currency: "eur", setCurrency });

    render(<ParamButton />);

    expect(screen.queryByText("EUR €")).toBeNull();

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("EUR €")).toBeTruthy();

    fireEvent.click(screen.getByText("USD $"));
    expect(setCurrency).toHaveBeenCalledWith("usd");
  });

  it("closes the menu on outside click", () => {
    vi.mocked(useCurrency).mockReturnValue({ currency: "eur", setCurrency: vi.fn() });

    render(
      <div>
        <ParamButton />
        <button>outside</button>
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "" }));
    expect(screen.getByText("EUR €")).toBeTruthy();

    fireEvent.mouseDown(screen.getByText("outside"));
    expect(screen.queryByText("EUR €")).toBeNull();
  });
});
