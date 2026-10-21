"use client";

import { useAppSelector } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import type { CryptoMarketData } from "@/app/types/Crypto/Crypto";
import type { Currency } from "@/app/context/Curency/CurrencyContext";
import { formatFiatPrice } from "@/app/utils/Format/FrFormat/FrFormat";

export interface PositionView {
  coinId: string;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  amount: number;
  avgBuyPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  /** Share of the total portfolio value (cash included), in %. */
  share: number;
}

/**
 * The simulated portfolio, converted to the display currency.
 *
 * Everything is stored in EUR internally; live coin prices already come in the
 * display currency, so only stored amounts are multiplied.
 */
export function usePortfolio(coins: CryptoMarketData[]) {
  const { currency } = useCurrency();
  const sim = useAppSelector((state) => state.simulation);
  const usdPerEur = useAppSelector((state) => state.exchangeRate.usdPerEur);
  const multiplier = currency === "usd" ? (usdPerEur ?? 1) : 1;

  const balance = sim.balance * multiplier;
  const initialBalance = sim.initialBalance * multiplier;
  const realizedPnl = sim.realizedPnl * multiplier;

  const rawPositions = sim.holdings.map((h) => {
    const avgBuyPrice = h.avgBuyPrice * multiplier;
    const currentPrice =
      coins.find((c) => c.id === h.coinId)?.price ?? avgBuyPrice;
    const pnl = (currentPrice - avgBuyPrice) * h.amount;
    return {
      ...h,
      avgBuyPrice,
      currentPrice,
      value: h.amount * currentPrice,
      pnl,
      pnlPercent: avgBuyPrice > 0 ? (currentPrice / avgBuyPrice - 1) * 100 : 0,
    };
  });

  const holdingsValue = rawPositions.reduce((sum, p) => sum + p.value, 0);
  const unrealizedPnl = rawPositions.reduce((sum, p) => sum + p.pnl, 0);
  const totalValue = balance + holdingsValue;
  const positions: PositionView[] = rawPositions.map((p) => ({
    ...p,
    share: totalValue > 0 ? (p.value / totalValue) * 100 : 0,
  }));
  const pnl = totalValue - initialBalance;
  const pnlPercent = initialBalance > 0 ? (pnl / initialBalance) * 100 : 0;

  return {
    currency,
    multiplier,
    balance,
    initialBalance,
    realizedPnl,
    unrealizedPnl,
    positions,
    holdingsValue,
    totalValue,
    pnl,
    pnlPercent,
  };
}

export const trendColor = (v: number) =>
  v > 0 ? "var(--n-up)" : v < 0 ? "var(--n-down)" : "var(--n-neutral-400)";

/** Signed fiat amount with a true minus, e.g. "+50,00 €" / "−12,30 €". */
export function signedFiat(value: number, currency: Currency) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return sign + formatFiatPrice(Math.abs(value), currency);
}

/** Crypto quantity: 6 decimals, French separators ("0,186000"). */
export function formatQuantity(amount: number) {
  return amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  });
}

/** Share of the portfolio, e.g. "99,7 %". */
export function formatShare(share: number) {
  return (
    share.toLocaleString("fr-FR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + " %"
  );
}
