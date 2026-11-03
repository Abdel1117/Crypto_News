"use client";

import type { ProPortfolio } from "@/app/lib/api/simulationPro";
import {
  formatFiatPrice,
  formatSignedPercent,
} from "@/app/utils/Format/FrFormat/FrFormat";
import { signedFiat, trendColor } from "@/app/components/Simulation/usePortfolio";

interface ProSummaryProps {
  portfolio: ProPortfolio;
  /** Real-time state (see useLivePortfolio); omitted, no indicator is shown. */
  live?: { updatedAt: string | null; delayed: boolean };
}

function liveLabel(delayed: boolean, time: string | null): string {
  if (delayed) return time ? `Prix différés · dernière mise à jour à ${time}` : "Prix différés";
  return time ? `En direct · mis à jour à ${time}` : "En direct · actualisé toutes les 30 s";
}

function LiveIndicator({ updatedAt, delayed }: Readonly<{ updatedAt: string | null; delayed: boolean }>) {
  const time = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;
  return (
    <p className="m-0 flex items-center justify-end gap-1.5 px-5 pt-3 -mb-2 text-xs text-(--n-neutral-500)">
      <span
        aria-hidden="true"
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: delayed ? "var(--n-neutral-500)" : "var(--n-up)" }}
      />
      {liveLabel(delayed, time)}
    </p>
  );
}

/** Headline figures of the logged-in portfolio. */
export default function ProSummary({ portfolio, live }: Readonly<ProSummaryProps>) {
  const { currency, pnl } = portfolio;
  const money = (v: number) => formatFiatPrice(v, currency);

  const details: { label: string; value: string; color?: string }[] = [
    { label: "Liquidités", value: money(portfolio.cash) },
    { label: "Investi en crypto", value: money(portfolio.holdings_value) },
    { label: "PnL réalisé", value: signedFiat(pnl.realized, currency), color: trendColor(pnl.realized) },
    { label: "PnL latent", value: signedFiat(pnl.unrealized, currency), color: trendColor(pnl.unrealized) },
    { label: "Frais payés", value: money(portfolio.stats.total_fees) },
    { label: "Impôt estimé", value: money(portfolio.tax.total) },
  ];

  return (
    <section className="n-panel n-tnum flex flex-col" aria-label="Résumé du portefeuille">
      {live && portfolio.positions.length > 0 && (
        <LiveIndicator updatedAt={live.updatedAt} delayed={live.delayed} />
      )}
      <div className="grid gap-4 sm:grid-cols-3 px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-(--n-neutral-400)">Valeur du portefeuille</span>
          <span className="text-[28px] lg:text-[32px] leading-tight font-medium tracking-[-0.015em] whitespace-nowrap">
            {money(portfolio.total_value)}
          </span>
          <span className="text-xs text-(--n-neutral-500)">
            Capital de départ {money(portfolio.initial_capital)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-(--n-neutral-400)">Profit / Perte</span>
          <span className="flex items-baseline gap-2 whitespace-nowrap" style={{ color: trendColor(pnl.total) }}>
            <span className="text-2xl font-medium">{signedFiat(pnl.total, currency)}</span>
            <span className="text-sm">{formatSignedPercent(pnl.total_percent)}</span>
          </span>
          <span className="text-xs text-(--n-neutral-500)">ROI depuis le début</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-(--n-neutral-400)">Après impôt estimé</span>
          <span className="text-2xl font-medium whitespace-nowrap" style={{ color: trendColor(pnl.after_tax) }}>
            {signedFiat(pnl.after_tax, currency)}
          </span>
          <span className="text-xs text-(--n-neutral-500)">Sur les plus-values réalisées</span>
        </div>
      </div>
      <dl className="m-0 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-x-4 gap-y-3 px-5 py-3.5 border-t border-(--n-divider) text-sm">
        {details.map((d) => (
          <div key={d.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-(--n-neutral-500)">{d.label}</dt>
            <dd className="m-0 font-medium whitespace-nowrap" style={d.color ? { color: d.color } : undefined}>
              {d.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
