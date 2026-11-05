"use client";

import type { ProPortfolio } from "@/app/lib/api/simulationPro";
import { formatFiatPrice } from "@/app/utils/Format/FrFormat/FrFormat";
import { signedFiat, trendColor } from "@/app/components/Simulation/usePortfolio";
import { formatDuration, formatFraction } from "./format";

interface Stat {
  label: string;
  value: string;
  hint: string;
  color?: string;
}

function winRateHint(sells: number): string {
  if (sells === 0) return "Aucune vente pour le moment.";
  return `Ventes gagnantes sur ${sells} vente${sells > 1 ? "s" : ""}.`;
}

/** Risk and trading statistics. */
export default function StatsGrid({ portfolio }: Readonly<{ portfolio: ProPortfolio }>) {
  const { risk, stats, currency } = portfolio;

  const riskStats: Stat[] = [
    {
      label: "Baisse maximale",
      value: risk.max_drawdown === null ? "—" : `−${formatFraction(risk.max_drawdown)}`,
      hint:
        risk.max_drawdown === null
          ? "Disponible après 2 jours d'historique."
          : "Pire recul depuis un sommet (max drawdown).",
      color: risk.max_drawdown ? "var(--n-down)" : undefined,
    },
    {
      label: "Volatilité annualisée",
      value: formatFraction(risk.volatility),
      hint:
        risk.volatility === null
          ? "Disponible après 3 jours d'historique."
          : "Amplitude des variations quotidiennes, sur un an.",
    },
  ];

  const tradeStats: Stat[] = [
    {
      label: "Taux de réussite",
      value: formatFraction(stats.win_rate, 0),
      hint: winRateHint(stats.sells_count),
    },
    {
      label: "Meilleure vente",
      value: stats.best_sale ? signedFiat(stats.best_sale.realized_pnl, currency) : "—",
      hint: stats.best_sale ? stats.best_sale.symbol : "Aucune vente pour le moment.",
      color: stats.best_sale ? trendColor(stats.best_sale.realized_pnl) : undefined,
    },
    {
      label: "Pire vente",
      value: stats.worst_sale ? signedFiat(stats.worst_sale.realized_pnl, currency) : "—",
      hint: stats.worst_sale ? stats.worst_sale.symbol : "Aucune vente pour le moment.",
      color: stats.worst_sale ? trendColor(stats.worst_sale.realized_pnl) : undefined,
    },
    {
      label: "Durée moyenne de détention",
      value: formatDuration(stats.avg_holding_days),
      hint: "Des cryptos vendues, de l'achat à la vente.",
    },
    {
      label: "Frais payés",
      value: formatFiatPrice(stats.total_fees, currency),
      hint: `0,1 % par ordre · ${stats.trades_count} ordre${stats.trades_count > 1 ? "s" : ""}.`,
    },
  ];

  const group = (title: string, items: Stat[]) => (
    <div className="flex flex-col gap-2">
      <h3 className="m-0 text-[11px] tracking-[0.08em] uppercase text-[color-mix(in_srgb,var(--n-text)_60%,transparent)]">
        {title}
      </h3>
      <dl className="m-0 grid gap-3 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
        {items.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5 rounded-lg px-3.5 py-3 bg-[color-mix(in_srgb,var(--n-text)_4%,transparent)]">
            <dt className="text-xs text-(--n-neutral-400)">{s.label}</dt>
            <dd className="m-0 text-lg font-medium n-tnum" style={s.color ? { color: s.color } : undefined}>
              {s.value}
            </dd>
            <dd className="m-0 text-xs leading-snug text-(--n-neutral-500)">{s.hint}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  return (
    <section className="n-panel flex flex-col gap-4 px-5 py-4" aria-labelledby="stats-title">
      <h2 id="stats-title" className="m-0 text-base">
        Statistiques
      </h2>
      {group("Risque", riskStats)}
      {group("Ordres", tradeStats)}
    </section>
  );
}
