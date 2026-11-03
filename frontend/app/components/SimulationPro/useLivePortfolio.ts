"use client";

import { useEffect, useState } from "react";
import { useAppDispatch } from "@/app/lib/hooks";
import type { ProPortfolio } from "@/app/lib/api/simulationPro";
import { fetchQuotes } from "@/app/lib/features/simulationPro/simulationProThunks";

/** Same rhythm as the server's CoinGecko cache: refreshing faster returns the same prices. */
export const LIVE_REFRESH_MS = 30_000;

/**
 * The portfolio recomputed with live prices, with the server's formulas:
 * value = cash + Σ quantity × price, PnL = value − starting capital, and after
 * tax = PnL − estimated tax (the tax covers realized gains, so prices don't
 * change it). A coin without a live price keeps the server's price.
 */
export function applyLivePrices(
  portfolio: ProPortfolio,
  prices: Record<string, number>,
): ProPortfolio {
  const positions = portfolio.positions.map((p) => {
    const live = prices[p.coin_id];
    const price = live ?? p.price;
    const value = p.quantity * price;
    return {
      ...p,
      price,
      price_stale: live === undefined ? p.price_stale : false,
      value,
      pnl: value - p.cost,
      pnl_percent: p.cost > 0 ? (value / p.cost - 1) * 100 : 0,
    };
  });
  const holdings = positions.reduce((sum, p) => sum + p.value, 0);
  const total = portfolio.cash + holdings;
  const pnlTotal = total - portfolio.initial_capital;

  return {
    ...portfolio,
    // Rows keep the server's order, so the list doesn't jump at each refresh.
    positions: positions.map((p) => ({ ...p, share: total > 0 ? (p.value / total) * 100 : 0 })),
    holdings_value: holdings,
    total_value: total,
    pnl: {
      ...portfolio.pnl,
      total: pnlTotal,
      total_percent:
        portfolio.initial_capital > 0 ? (pnlTotal / portfolio.initial_capital) * 100 : 0,
      unrealized: positions.reduce((sum, p) => sum + p.pnl, 0),
      after_tax: pnlTotal - portfolio.tax.total,
    },
  };
}

interface LiveQuote {
  /** The server portfolio these prices apply to: a new one replaces them. */
  base: ProPortfolio;
  prices: Record<string, number>;
  stale: string[];
  at: string | null;
  failed: boolean;
}

export interface LivePortfolio {
  portfolio: ProPortfolio | null;
  /** Time of the last live prices; null until the first refresh. */
  updatedAt: string | null;
  /** The last refresh failed, or some coins have no live price. */
  delayed: boolean;
}

/**
 * Refreshes the prices of the coins held every 30 seconds while the tab is
 * visible, and once as soon as it becomes visible again. Display only: orders,
 * taxes and history keep the server's values.
 */
export function useLivePortfolio(portfolio: ProPortfolio | null): LivePortfolio {
  const dispatch = useAppDispatch();
  const [quote, setQuote] = useState<LiveQuote | null>(null);
  const holdsCoins = Boolean(portfolio && portfolio.positions.length > 0);

  useEffect(() => {
    if (!portfolio || !holdsCoins) return;
    const base = portfolio;
    let cancelled = false;
    let timer: number | undefined;

    const load = () => {
      dispatch(fetchQuotes())
        .unwrap()
        .then((q) => {
          if (!cancelled) {
            setQuote({ base, prices: q.prices, stale: q.stale, at: q.at, failed: false });
          }
        })
        .catch(() => {
          if (cancelled) return;
          // Keep the last prices of this portfolio and say they're delayed.
          setQuote((prev) =>
            prev && prev.base === base
              ? { ...prev, failed: true }
              : { base, prices: {}, stale: [], at: null, failed: true },
          );
        });
    };
    const start = () => {
      if (timer === undefined) timer = window.setInterval(load, LIVE_REFRESH_MS);
    };
    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        load();
        start();
      } else {
        stop();
      }
    };

    // The portfolio was just loaded with fresh prices: the first refresh can wait.
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [dispatch, portfolio, holdsCoins]);

  if (!portfolio) return { portfolio: null, updatedAt: null, delayed: false };
  const current = quote && quote.base === portfolio ? quote : null;
  return {
    portfolio: current ? applyLivePrices(portfolio, current.prices) : portfolio,
    updatedAt: current?.at ?? null,
    delayed: Boolean(current && (current.failed || current.stale.length > 0)),
  };
}
