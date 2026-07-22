import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CurrencyProvider, useCurrency } from "../../app/context/Curency/CurrencyContext";

function Probe() {
  const { currency, setCurrency } = useCurrency();
  return (
    <div>
      <span>currency-{currency}</span>
      <button onClick={() => setCurrency("usd")}>set-usd</button>
    </div>
  );
}

describe("CurrencyContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("throws when used outside of the provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      "useCurrency must be used within a CurrencyProvider",
    );
    consoleError.mockRestore();
  });

  it("defaults to eur", () => {
    render(
      <CurrencyProvider>
        <Probe />
      </CurrencyProvider>,
    );
    expect(screen.getByText("currency-eur")).toBeTruthy();
  });

  it("hydrates from a persisted currency", () => {
    localStorage.setItem("currency", "usd");
    render(
      <CurrencyProvider>
        <Probe />
      </CurrencyProvider>,
    );
    expect(screen.getByText("currency-usd")).toBeTruthy();
  });

  it("updates the currency and persists it", () => {
    render(
      <CurrencyProvider>
        <Probe />
      </CurrencyProvider>,
    );

    fireEvent.click(screen.getByText("set-usd"));

    expect(screen.getByText("currency-usd")).toBeTruthy();
    expect(localStorage.getItem("currency")).toBe("usd");
  });
});
