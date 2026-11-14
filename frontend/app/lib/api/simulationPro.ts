import { authFetchJson, type ThunkTools } from "../auth/authFetch";
import { fetchJson } from "./fetchJson";

const API = process.env.NEXT_PUBLIC_API_BACK_END;

export type CountryCode = "FR" | "BE" | "CH" | "DE" | "ES" | "IT" | "GB" | "US";
export type PortfolioCurrency = "eur" | "usd";

export const MIN_CAPITAL = 1000;
export const MAX_CAPITAL = 50000;

export interface CountryRule {
  code: CountryCode;
  name: string;
  default_currency: PortfolioCurrency;
  summary: string;
  notes: string[];
  sources: { label: string; url: string }[];
  verified_on: string;
}

export interface ProPosition {
  coin_id: string;
  symbol: string;
  name: string;
  image: string;
  quantity: number;
  avg_cost: number;
  cost: number;
  price: number;
  price_stale: boolean;
  value: number;
  pnl: number;
  pnl_percent: number;
  share: number;
}

export interface TaxYear {
  year: string;
  sales_total: number;
  net_gain: number;
  short_term_gain: number;
  long_term_gain: number;
  taxable_gain: number;
  exempt: boolean;
  tax: number;
}

export interface SaleSummary {
  trade_id: number;
  symbol: string;
  realized_pnl: number;
  executed_at: string;
}

export interface ProPortfolio {
  id: number;
  currency: PortfolioCurrency;
  country: CountryCode;
  initial_capital: number;
  fee_rate: number;
  created_at: string;
  cash: number;
  holdings_value: number;
  total_value: number;
  positions: ProPosition[];
  pnl: {
    total: number;
    total_percent: number;
    realized: number;
    unrealized: number;
    after_tax: number;
  };
  tax: {
    country: CountryCode;
    years: TaxYear[];
    total: number;
    fx_estimated: boolean;
  };
  risk: { max_drawdown: number | null; volatility: number | null; days: number };
  stats: {
    trades_count: number;
    sells_count: number;
    win_rate: number | null;
    best_sale: SaleSummary | null;
    worst_sale: SaleSummary | null;
    avg_holding_days: number | null;
    total_fees: number;
  };
  history: { day: string; value: number }[];
}

export interface ProTrade {
  id: number;
  coin_id: string;
  symbol: string;
  name: string;
  image: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  gross: number;
  fee: number;
  total: number;
  realized_pnl: number | null;
  taxable_gain: number | null;
  executed_at: string;
}

export interface PortfolioSettings {
  initial_capital: number;
  currency: PortfolioCurrency;
  country: CountryCode;
}

/** Exactly one of `quantity` or `amount` (money to spend, buys only). */
export interface TradeOrder {
  coin_id: string;
  side: "buy" | "sell";
  quantity?: string;
  amount?: string;
}

export function getCountries(): Promise<CountryRule[]> {
  return fetchJson<CountryRule[]>(`${API}/simulation/countries`);
}

export function getPortfolio(tools: ThunkTools): Promise<ProPortfolio> {
  return authFetchJson<ProPortfolio>(`${API}/simulation/portfolio`, {}, tools);
}

export function createPortfolio(
  settings: PortfolioSettings,
  tools: ThunkTools,
): Promise<ProPortfolio> {
  return authFetchJson<ProPortfolio>(
    `${API}/simulation/portfolio`,
    { method: "POST", body: JSON.stringify(settings) },
    tools,
  );
}

export function updateCountry(
  country: CountryCode,
  tools: ThunkTools,
): Promise<ProPortfolio> {
  return authFetchJson<ProPortfolio>(
    `${API}/simulation/portfolio`,
    { method: "PATCH", body: JSON.stringify({ country }) },
    tools,
  );
}

export function resetPortfolio(
  settings: PortfolioSettings,
  tools: ThunkTools,
): Promise<ProPortfolio> {
  return authFetchJson<ProPortfolio>(
    `${API}/simulation/portfolio/reset`,
    { method: "POST", body: JSON.stringify(settings) },
    tools,
  );
}

export function placeTrade(order: TradeOrder, tools: ThunkTools): Promise<ProTrade> {
  return authFetchJson<ProTrade>(
    `${API}/simulation/trades`,
    { method: "POST", body: JSON.stringify(order) },
    tools,
  );
}

export function getTrades(
  tools: ThunkTools,
  limit = 100,
  offset = 0,
): Promise<{ items: ProTrade[]; total: number }> {
  return authFetchJson(
    `${API}/simulation/trades?limit=${limit}&offset=${offset}`,
    {},
    tools,
  );
}

export interface LiveQuotes {
  /** coin id → price in the portfolio's currency */
  prices: Record<string, number>;
  /** coins held but without a live price */
  stale: string[];
  at: string;
}

/** Live prices of the coins held (read-only, light: safe to call every 30 s). */
export function getQuotes(tools: ThunkTools): Promise<LiveQuotes> {
  return authFetchJson<LiveQuotes>(`${API}/simulation/quotes`, {}, tools);
}
