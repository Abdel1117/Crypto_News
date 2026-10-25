"use client";

import React from "react";
import { useAppSelector } from "@/app/lib/hooks";
import { CryptoMarketData } from "@/app/types/Crypto/Crypto";
import {
  formatFiatPrice,
  formatSignedPercent,
} from "@/app/utils/Format/FrFormat/FrFormat";
import { signedFiat, trendColor, usePortfolio } from "./usePortfolio";

interface PortfolioSummaryProps {
  coins: CryptoMarketData[];
  /** Mobile only: the performance chart, shown inside the summary card. */
  chart?: React.ReactNode;
}

const ROW_RULE =
  "linear-gradient(to right, transparent, color-mix(in srgb, var(--n-text) 8%, transparent) 48px, color-mix(in srgb, var(--n-text) 8%, transparent) calc(100% - 48px), transparent) no-repeat top / 100% 1px";

/**
 * Headline figures: one band on desktop; on mobile a card that also holds
 * the performance chart.
 */
export default function PortfolioSummary({
  coins,
  chart,
}: PortfolioSummaryProps) {
  const loading = useAppSelector((state) => state.prices.loading);
  const p = usePortfolio(coins);
  const money = (v: number) => formatFiatPrice(v, p.currency);
  const pnlColor = trendColor(p.pnl);
  const valueClass = loading ? "opacity-50" : "";

  return (
    <>
      {/* Desktop band */}
      <section
        className="hidden lg:grid grid-cols-[1.4fr_1.3fr_1fr] py-[18px] n-panel n-tnum"
        aria-label="Résumé du portefeuille"
      >
        <div className="flex flex-col gap-1.5 px-[22px]">
          <span className="text-[13px] text-(--n-neutral-400)">
            Valeur du portefeuille
          </span>
          <span
            className={`text-[32px] leading-tight font-medium tracking-[-0.015em] whitespace-nowrap ${valueClass}`}
          >
            {money(p.totalValue)}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 px-[22px] shadow-[inset_1px_0_0_color-mix(in_srgb,var(--n-text)_8%,transparent)]">
          <span className="text-[13px] text-(--n-neutral-400)">
            Profit / Perte
          </span>
          <span
            className="flex items-baseline gap-2 whitespace-nowrap"
            style={{ color: pnlColor }}
          >
            <span className="text-2xl font-medium">
              {signedFiat(p.pnl, p.currency)}
            </span>
            <span className="text-sm">{formatSignedPercent(p.pnlPercent)}</span>
          </span>
          <span className="text-xs text-(--n-neutral-500)">
            Non réalisé {signedFiat(p.unrealizedPnl, p.currency)} · Réalisé{" "}
            {signedFiat(p.realizedPnl, p.currency)}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 px-[22px] shadow-[inset_1px_0_0_color-mix(in_srgb,var(--n-text)_8%,transparent)]">
          <span className="text-[13px] text-(--n-neutral-400)">
            Solde disponible
          </span>
          <span className="text-2xl font-medium whitespace-nowrap">
            {money(p.balance)}
          </span>
          <span className="text-xs text-(--n-neutral-500)">
            sur {money(p.initialBalance)} de départ
          </span>
        </div>
      </section>

      {/* Mobile card */}
      <section
        className="lg:hidden flex flex-col gap-3 p-3.5 n-panel n-tnum"
        aria-label="Résumé du portefeuille"
      >
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-(--n-neutral-400)">
            Valeur du portefeuille
          </span>
          <span
            className={`text-[28px] leading-tight font-medium tracking-[-0.015em] ${valueClass}`}
          >
            {money(p.totalValue)}
          </span>
          <span className="flex gap-2 text-sm" style={{ color: pnlColor }}>
            {signedFiat(p.pnl, p.currency)}
            <span>{formatSignedPercent(p.pnlPercent)}</span>
          </span>
        </div>
        <dl
          className="m-0 grid grid-cols-3 gap-2.5 pt-3"
          style={{ background: ROW_RULE }}
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <dt className="text-[11px] text-(--n-neutral-400)">Solde</dt>
            <dd className="m-0 text-sm font-medium whitespace-nowrap">
              {money(p.balance)}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <dt className="text-[11px] text-(--n-neutral-400)">Non réalisé</dt>
            <dd
              className="m-0 text-sm font-medium whitespace-nowrap"
              style={{ color: trendColor(p.unrealizedPnl) }}
            >
              {signedFiat(p.unrealizedPnl, p.currency)}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <dt className="text-[11px] text-(--n-neutral-400)">Réalisé</dt>
            <dd className="m-0 text-sm font-medium whitespace-nowrap">
              {signedFiat(p.realizedPnl, p.currency)}
            </dd>
          </div>
        </dl>
        {chart}
      </section>
    </>
  );
}
