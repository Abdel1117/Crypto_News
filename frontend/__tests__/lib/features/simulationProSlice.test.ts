import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPortfolio,
  fetchPortfolio,
  placeTrade,
  resetPortfolio,
} from "@/app/lib/features/simulationPro/simulationProThunks";
import { logout } from "@/app/lib/features/auth/authSlice";
import { jsonResponse, makePortfolio, makeProStore, makeTrade } from "../simulationProTestUtils";

afterEach(() => {
  vi.unstubAllGlobals();
});

function routeFetch(routes: Record<string, () => Response>) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const path = new URL(url, "http://x").pathname;
    const route = Object.keys(routes).find((r) => {
      const [m, p] = r.split(" ");
      return m === method && path.endsWith(p);
    });
    if (!route) throw new Error(`unexpected ${method} ${path}`);
    return routes[route]();
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("simulationPro slice", () => {
  it("shows onboarding when the user has no portfolio", async () => {
    routeFetch({ "GET /simulation/portfolio": () => jsonResponse(404, { detail: "none" }) });
    const store = makeProStore();

    await store.dispatch(fetchPortfolio());

    expect(store.getState().simulationPro.status).toBe("missing");
    expect(store.getState().simulationPro.portfolio).toBeNull();
  });

  it("loads the portfolio", async () => {
    routeFetch({ "GET /simulation/portfolio": () => jsonResponse(200, makePortfolio()) });
    const store = makeProStore();

    await store.dispatch(fetchPortfolio());

    expect(store.getState().simulationPro.status).toBe("ready");
    expect(store.getState().simulationPro.portfolio?.total_value).toBe(10100);
  });

  it("reports a load error", async () => {
    routeFetch({ "GET /simulation/portfolio": () => jsonResponse(500, { detail: "Boom" }) });
    const store = makeProStore();

    await store.dispatch(fetchPortfolio());

    expect(store.getState().simulationPro.status).toBe("error");
    expect(store.getState().simulationPro.error).toBe("Boom");
  });

  it("creates the portfolio with the chosen settings", async () => {
    const fetchMock = routeFetch({
      "POST /simulation/portfolio": () => jsonResponse(201, makePortfolio({ cash: 25000 })),
    });
    const store = makeProStore({ status: "missing" });

    await store.dispatch(createPortfolio({ initial_capital: 25000, currency: "usd", country: "US" }));

    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({
      initial_capital: 25000,
      currency: "usd",
      country: "US",
    });
    const state = store.getState().simulationPro;
    expect(state.status).toBe("ready");
    expect(state.saving).toBe(false);
  });

  it("shows why a creation failed", async () => {
    routeFetch({
      "POST /simulation/portfolio": () => jsonResponse(409, { detail: "Tu as déjà un portefeuille de simulation." }),
    });
    const store = makeProStore({ status: "missing" });

    await store.dispatch(createPortfolio({ initial_capital: 1000, currency: "eur", country: "FR" }));

    expect(store.getState().simulationPro.saveError).toBe("Tu as déjà un portefeuille de simulation.");
  });

  it("places an order, then reloads the portfolio and the history", async () => {
    const fetchMock = routeFetch({
      "POST /simulation/trades": () => jsonResponse(201, makeTrade()),
      "GET /simulation/portfolio": () => jsonResponse(200, makePortfolio({ cash: 5000 })),
      "GET /simulation/trades": () => jsonResponse(200, { items: [makeTrade()], total: 1 }),
    });
    const store = makeProStore({ status: "ready", portfolio: makePortfolio() });

    await store.dispatch(placeTrade({ coin_id: "bitcoin", side: "buy", amount: "1000" }));

    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({
      coin_id: "bitcoin",
      side: "buy",
      amount: "1000",
    });
    const state = store.getState().simulationPro;
    expect(state.portfolio?.cash).toBe(5000);
    expect(state.tradesTotal).toBe(1);
    expect(state.trading).toBe(false);
  });

  it("keeps the server's reason when an order is refused", async () => {
    routeFetch({
      "POST /simulation/trades": () => jsonResponse(409, { detail: "Solde insuffisant pour cet achat." }),
    });
    const store = makeProStore({ status: "ready", portfolio: makePortfolio() });

    await store.dispatch(placeTrade({ coin_id: "bitcoin", side: "buy", amount: "999999" }));

    expect(store.getState().simulationPro.tradeError).toBe("Solde insuffisant pour cet achat.");
  });

  it("clears the history on reset", async () => {
    routeFetch({ "POST /simulation/portfolio/reset": () => jsonResponse(200, makePortfolio({ positions: [] })) });
    const store = makeProStore({ status: "ready", portfolio: makePortfolio(), trades: [makeTrade()], tradesTotal: 1 });

    await store.dispatch(resetPortfolio({ initial_capital: 5000, currency: "usd", country: "US" }));

    expect(store.getState().simulationPro.trades).toEqual([]);
    expect(store.getState().simulationPro.tradesTotal).toBe(0);
  });

  it("forgets the portfolio on logout", () => {
    const store = makeProStore({ status: "ready", portfolio: makePortfolio(), trades: [makeTrade()] });

    store.dispatch(logout());

    const state = store.getState().simulationPro;
    expect(state.portfolio).toBeNull();
    expect(state.trades).toEqual([]);
    expect(state.status).toBe("idle");
  });
});
