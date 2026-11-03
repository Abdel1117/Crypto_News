"use client";

import CoinAvatar from "@/app/ui/CoinAvatar/CoinAvatar";
import type { ProPortfolio } from "@/app/lib/api/simulationPro";
import {
  formatFiatPrice,
  formatSignedPercent,
} from "@/app/utils/Format/FrFormat/FrFormat";
import {
  formatQuantity,
  formatShare,
  signedFiat,
  trendColor,
} from "@/app/components/Simulation/usePortfolio";

const COLS = "grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))_minmax(0,1.2fr)_120px]";

interface ProPositionsProps {
  portfolio: ProPortfolio;
  selectedId: string | null;
  onSelect: (coinId: string) => void;
}

/** Open positions at live prices. A click loads the coin in the order form. */
export default function ProPositions({ portfolio, selectedId, onSelect }: ProPositionsProps) {
  const { positions, currency } = portfolio;
  const money = (v: number) => formatFiatPrice(v, currency);

  return (
    <section
      className="flex flex-col gap-2 lg:rounded-lg lg:bg-(--n-surface) lg:px-5 lg:pt-4 lg:pb-2"
      aria-labelledby="pro-positions-title"
    >
      <h2 id="pro-positions-title" className="m-0 text-base">
        Positions
      </h2>

      {positions.length === 0 ? (
        <p className="n-panel lg:bg-transparent! m-0 px-3.5 py-4 lg:px-0 lg:pt-1 lg:pb-3 text-sm text-(--n-neutral-400)">
          Aucune position ouverte. Cherche une crypto dans le formulaire d&apos;ordre
          pour passer ton premier achat.
        </p>
      ) : (
        <>
          <div role="table" aria-label="Positions ouvertes" className="hidden lg:flex flex-col n-tnum">
            <div
              role="row"
              className={`grid ${COLS} items-center py-1.5 text-[11px] tracking-[0.08em] uppercase text-[color-mix(in_srgb,var(--n-text)_60%,transparent)] border-b border-(--n-divider)`}
            >
              <span role="columnheader">Actif</span>
              <span role="columnheader" className="text-right">Quantité</span>
              <span role="columnheader" className="text-right">Prix moyen</span>
              <span role="columnheader" className="text-right">Prix actuel</span>
              <span role="columnheader" className="text-right">Valeur</span>
              <span role="columnheader" className="text-right">PnL latent</span>
              <span role="columnheader" className="pl-6">Part</span>
            </div>
            {positions.map((p) => (
              <div
                key={p.coin_id}
                role="row"
                className={`n-row-btn grid ${COLS} items-center min-h-13.5 text-sm border-b border-(--n-divider) last:border-b-0 ${
                  p.coin_id === selectedId ? "bg-[color-mix(in_srgb,var(--n-accent)_8%,transparent)]" : ""
                }`}
                onClick={() => onSelect(p.coin_id)}
              >
                <span role="cell" className="flex items-center gap-2.5 min-w-0">
                  <CoinAvatar image={p.image} name={p.name} symbol={p.symbol} size={26} />
                  <button
                    type="button"
                    className="min-w-0 truncate p-0 border-0 bg-transparent font-[inherit] font-medium text-(--n-text) cursor-pointer text-left hover:text-(--n-accent)"
                    aria-pressed={p.coin_id === selectedId}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(p.coin_id);
                    }}
                  >
                    {p.name}
                  </button>
                  <span className="text-[13px] text-(--n-neutral-500)">{p.symbol.toUpperCase()}</span>
                </span>
                <span role="cell" className="text-right whitespace-nowrap text-(--n-neutral-300)">
                  {formatQuantity(p.quantity)}
                </span>
                <span role="cell" className="text-right whitespace-nowrap text-(--n-neutral-300)">
                  {money(p.avg_cost)}
                </span>
                <span role="cell" className="text-right whitespace-nowrap">
                  {money(p.price)}
                  {p.price_stale && (
                    <span className="block text-[11px] text-(--n-neutral-500)" title="Prix en direct indisponible">
                      dernier prix connu
                    </span>
                  )}
                </span>
                <span role="cell" className="text-right whitespace-nowrap font-medium">
                  {money(p.value)}
                </span>
                <span
                  role="cell"
                  className="flex flex-col items-end leading-[1.3] whitespace-nowrap"
                  style={{ color: trendColor(p.pnl) }}
                >
                  <span>{signedFiat(p.pnl, currency)}</span>
                  <span className="text-xs">{formatSignedPercent(p.pnl_percent)}</span>
                </span>
                <span role="cell" className="pl-6 text-xs text-(--n-neutral-400)">
                  {formatShare(p.share)}
                </span>
              </div>
            ))}
          </div>

          <ul className="lg:hidden flex flex-col gap-px m-0 p-0 list-none rounded-lg overflow-hidden n-tnum bg-[color-mix(in_srgb,var(--n-text)_7%,var(--n-surface))]">
            {positions.map((p) => (
              <li key={p.coin_id}>
                <button
                  type="button"
                  className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 w-full min-h-16 px-3.5 border-0 bg-(--n-surface) text-left font-[inherit] text-(--n-text) cursor-pointer"
                  aria-label={`${p.name} : passer un ordre`}
                  onClick={() => onSelect(p.coin_id)}
                >
                  <CoinAvatar image={p.image} name={p.name} symbol={p.symbol} size={32} />
                  <span className="flex flex-col leading-[1.35] min-w-0">
                    <span className="text-sm font-medium truncate">{p.name}</span>
                    <span className="text-xs text-(--n-neutral-500) truncate">
                      {formatQuantity(p.quantity)} {p.symbol.toUpperCase()} · {formatShare(p.share)}
                    </span>
                  </span>
                  <span className="flex flex-col items-end leading-[1.35]">
                    <span className="text-sm font-medium whitespace-nowrap">{money(p.value)}</span>
                    <span className="text-xs whitespace-nowrap" style={{ color: trendColor(p.pnl) }}>
                      {signedFiat(p.pnl, currency)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
