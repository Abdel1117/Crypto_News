import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";

vi.mock("@/app/hooks/useMediaQuery", () => ({
  useIsDesktop: vi.fn(() => true),
  useMediaQuery: vi.fn(() => true),
}));
vi.mock("@/app/components/AppShell/HeaderSlots", () => ({
  HeaderActions: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
// lightweight-charts needs a canvas, which jsdom doesn't have.
vi.mock("@/app/components/SimulationPro/ValueChart", () => ({
  default: () => <div data-testid="value-chart" />,
}));
vi.mock("@/app/lib/api/crypto", () => ({
  searchSymbols: vi.fn().mockResolvedValue([]),
  fetchMarketCoin: vi.fn().mockResolvedValue({ price: 65000 }),
}));

import ProSimulation from "@/app/components/SimulationPro/ProSimulation";
import {
  COUNTRIES,
  jsonResponse,
  makePortfolio,
  makeProStore,
  makeTrade,
} from "../../lib/simulationProTestUtils";

function stubApi(portfolioStatus: number, portfolio: unknown = makePortfolio()) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = new URL(url, "http://x").pathname;
    if (path.endsWith("/simulation/countries")) return jsonResponse(200, COUNTRIES);
    if (path.endsWith("/simulation/trades")) return jsonResponse(200, { items: [makeTrade()], total: 1 });
    if (path.endsWith("/simulation/portfolio") && init?.method === "POST") {
      return jsonResponse(201, makePortfolio());
    }
    return jsonResponse(portfolioStatus, portfolio);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPro() {
  const store = makeProStore();
  render(
    <Provider store={store}>
      <ProSimulation />
    </Provider>,
  );
  return store;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ProSimulation", () => {
  it("asks a new user to create a portfolio, then shows it", async () => {
    const fetchMock = stubApi(404, { detail: "Aucun portefeuille de simulation." });
    renderPro();

    fireEvent.click(await screen.findByRole("button", { name: "Commencer la simulation" }));

    expect(await screen.findByLabelText("Résumé du portefeuille")).toBeTruthy();
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(JSON.parse(post[1]!.body as string)).toEqual({
      initial_capital: 10000,
      currency: "eur",
      country: "FR",
    });
  });

  it("shows the dashboard of an existing portfolio", async () => {
    stubApi(200);
    renderPro();

    expect(await screen.findByLabelText("Résumé du portefeuille")).toBeTruthy();
    expect(screen.getByTestId("value-chart")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Positions" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Statistiques" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Fiscalité : France" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Passer un ordre" })).toBeTruthy();
    await waitFor(() => expect(screen.getByRole("heading", { name: /Historique des ordres/ }).textContent).toContain("1"));
  });

  it("offers a retry when loading fails", async () => {
    const fetchMock = stubApi(500, { detail: "Erreur serveur." });
    renderPro();

    expect((await screen.findByRole("alert")).textContent).toContain("Erreur serveur.");
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes("countries")) return jsonResponse(200, COUNTRIES);
      if (String(url).includes("/simulation/trades")) return jsonResponse(200, { items: [], total: 0 });
      return jsonResponse(200, makePortfolio());
    });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(await screen.findByLabelText("Résumé du portefeuille")).toBeTruthy();
  });

  it("opens the settings to change the country", async () => {
    const fetchMock = stubApi(200);
    renderPro();
    fireEvent.click(await screen.findByRole("button", { name: "Paramètres de la simulation" }));

    const dialog = screen.getByRole("dialog", { name: "Paramètres de la simulation" });
    expect(dialog).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox", { name: "Pays de résidence" }), { target: { value: "US" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === "PATCH")).toBe(true),
    );
    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH")!;
    expect(JSON.parse(patch[1]!.body as string)).toEqual({ country: "US" });
  });
});
