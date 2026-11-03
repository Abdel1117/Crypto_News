import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/app/lib/features/auth/authSlice";
import simulationProReducer, {
  type SimulationProState,
} from "@/app/lib/features/simulationPro/simulationProSlice";
import type { AppDispatch } from "@/app/lib/store";
import type { CountryRule, ProPortfolio, ProTrade } from "@/app/lib/api/simulationPro";

export function jsonResponse(status: number, data: unknown) {
  const text = JSON.stringify(data);
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => text,
  } as unknown as Response;
}

export const COUNTRIES: CountryRule[] = [
  {
    code: "FR",
    name: "France",
    default_currency: "eur",
    summary: "Flat tax de 31,4 %.",
    notes: ["La formule tient compte de tout le portefeuille."],
    sources: [{ label: "impots.gouv.fr", url: "https://www.impots.gouv.fr/x" }],
    verified_on: "2026-11-02",
  },
  {
    code: "US",
    name: "États-Unis",
    default_currency: "usd",
    summary: "22 % ou 15 %.",
    notes: [],
    sources: [{ label: "IRS", url: "https://www.irs.gov/x" }],
    verified_on: "2026-11-02",
  },
];

export function makePortfolio(overrides: Partial<ProPortfolio> = {}): ProPortfolio {
  return {
    id: 1,
    currency: "eur",
    country: "FR",
    initial_capital: 10000,
    fee_rate: 0.001,
    created_at: "2026-11-01T10:00:00Z",
    cash: 7500,
    holdings_value: 2600,
    total_value: 10100,
    positions: [
      {
        coin_id: "bitcoin",
        symbol: "BTC",
        name: "Bitcoin",
        image: "",
        quantity: 0.04,
        avg_cost: 62500,
        cost: 2500,
        price: 65000,
        price_stale: false,
        value: 2600,
        pnl: 100,
        pnl_percent: 4,
        share: 25.74,
      },
    ],
    pnl: { total: 100, total_percent: 1, realized: 0, unrealized: 100, after_tax: 100 },
    tax: { country: "FR", years: [], total: 0, fx_estimated: false },
    risk: { max_drawdown: null, volatility: null, days: 1 },
    stats: {
      trades_count: 1,
      sells_count: 0,
      win_rate: null,
      best_sale: null,
      worst_sale: null,
      avg_holding_days: null,
      total_fees: 2.5,
    },
    history: [{ day: "2026-11-01", value: 10000 }],
    ...overrides,
  };
}

export function makeTrade(overrides: Partial<ProTrade> = {}): ProTrade {
  return {
    id: 1,
    coin_id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    image: "",
    side: "buy",
    quantity: 0.04,
    price: 62500,
    gross: 2500,
    fee: 2.5,
    total: 2502.5,
    realized_pnl: null,
    taxable_gain: null,
    executed_at: "2026-11-01T10:05:00Z",
    ...overrides,
  };
}

export function makeProStore(sim: Partial<SimulationProState> = {}, loggedIn = true) {
  const store = configureStore({
    reducer: { auth: authReducer, simulationPro: simulationProReducer },
    preloadedState: {
      auth: {
        user: loggedIn ? { id: "1", email: "t@example.com", fullName: "Test" } : null,
        accessToken: loggedIn ? "token-1" : null,
        expiresAt: loggedIn ? Date.now() + 3_600_000 : null,
        isAuthenticated: loggedIn,
        initializing: false,
      },
      simulationPro: {
        status: "idle" as const,
        portfolio: null,
        error: null,
        countries: COUNTRIES,
        trades: [],
        tradesTotal: 0,
        saving: false,
        saveError: null,
        trading: false,
        tradeError: null,
        ...sim,
      },
    },
  });
  // The thunks are typed against the full app state; this store holds the slices they use.
  return Object.assign(store, { dispatch: store.dispatch as AppDispatch });
}
