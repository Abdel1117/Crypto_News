import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/app/context/Curency/CurrencyContext", () => ({
  useCurrency: () => ({ currency: "eur", setCurrency: vi.fn() }),
}));

vi.mock("@/app/lib/hooks", () => ({
  useAppDispatch: vi.fn(),
}));

vi.mock("@/app/lib/features/symbol/symbolThunks", () => ({
  getSymbols: vi.fn(() => ({ type: "symbols/getSymbols" })),
}));

vi.mock("@/app/lib/features/symbol/symbolSlice", () => ({
  readLocalSymbols: vi.fn(),
  setSymbols: vi.fn(() => ({ type: "symbols/setSymbols" })),
}));

import { useAppDispatch } from "@/app/lib/hooks";
import { readLocalSymbols } from "@/app/lib/features/symbol/symbolSlice";
import SymbolsBootstrap from "../../../app/components/SymbolsBootstrap/SymbolsBootstrap";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SymbolsBootstrap", () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(mockDispatch);
    vi.mocked(readLocalSymbols).mockReturnValue([]);
  });

  it("renders nothing", () => {
    const { container } = render(<SymbolsBootstrap />);
    expect(container.firstChild).toBeNull();
  });

  it("dispatches getSymbols with the current currency", () => {
    render(<SymbolsBootstrap />);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "symbols/getSymbols" });
  });

  it("does not dispatch setSymbols when there are no persisted symbols", () => {
    render(<SymbolsBootstrap />);
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "symbols/setSymbols" }),
    );
  });

  it("dispatches setSymbols with persisted symbols when present", () => {
    vi.mocked(readLocalSymbols).mockReturnValue([
      { id: "bitcoin", symbol: "btc", name: "Bitcoin" },
    ]);
    render(<SymbolsBootstrap />);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "symbols/setSymbols" });
  });
});
