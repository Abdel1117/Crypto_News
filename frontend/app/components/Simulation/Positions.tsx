"use client";

import CoinAvatar from "@/app/ui/CoinAvatar/CoinAvatar";
import type { CryptoMarketData } from "@/app/types/Crypto/Crypto";
import {
  formatFiatPrice,
  formatSignedPercent,
} from "@/app/utils/Format/FrFormat/FrFormat";
import {
  formatQuantity,
  formatShare,
  signedFiat,
  trendColor,
  usePortfolio,
} from "./usePortfolio";

const COLS =
  "grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))_minmax(0,1.2fr)_140px]";

const ROW_RULE =
  "linear-gradient(to right, transparent, color-mix(in srgb, var(--n-text) 8%, transparent) 48px, color-mix(in srgb, var(--n-text) 8%, transparent) calc(100% - 48px), transparent)";

interface PositionsProps {
  coins: CryptoMarketData[];
  selectedId: string;
  onSelect: (coinId: string) => void;
}

/**
 * Open positions with their weight in the portfolio. A click loads the coin
 * in the order form.
 */
export default function Positions({
  coins,
  selectedId,
  onSelect,
}: PositionsProps) {
  const { positions, currency } = usePortfolio(coins);
  const money = (v: number) => formatFiatPrice(v, currency);

  return (
    <section
      className="flex flex-col gap-2 lg:rounded-lg lg:bg-(--n-surface) lg:px-5 lg:pt-4 lg:pb-2"
      aria-labelledby="positions-title"
    >
      <div className="flex items-center gap-2.5">
        <h2 id="positions-title" className="m-0 text-base">
          Positions
        </h2>
        {positions.length > 0 && (
          <span className="hidden lg:inline text-[13px] text-(--n-neutral-500)">
            {positions.length}
          </span>
        )}
      </div>

      {positions.length === 0 ? (
        <p className="n-panel lg:bg-transparent! m-0 px-3.5 py-4 lg:px-0 lg:pt-1 lg:pb-3 text-sm text-(--n-neutral-400)">
          Aucune position ouverte. Choisissez une crypto et passez un premier
          ordre d’achat.
        </p>
      ) : (
        <>
          <div
            role="table"
            aria-label="Positions ouvertes"
            className="hidden lg:flex flex-col n-tnum"
          >
            <div
              role="row"
              className={`relative grid ${COLS} items-center py-1.5 text-[11px] tracking-[0.08em] uppercase text-[color-mix(in_srgb,var(--n-text)_60%,transparent)]`}
            >
              <span role="columnheader">Actif</span>
              <span role="columnheader" className="text-right">
                Quantité
              </span>
              <span role="columnheader" className="text-right">
                Prix moyen
              </span>
              <span role="columnheader" className="text-right">
                Prix actuel
              </span>
              <span role="columnheader" className="text-right">
                Valeur
              </span>
              <span role="columnheader" className="text-right">
                PnL latent
              </span>
              <span role="columnheader" className="pl-6">
                Répartition
              </span>
              <div className="n-rule top-auto! bottom-0" />
            </div>
            {positions.map((p) => {
              const selected = p.coinId === selectedId;
              return (
                <div
                  key={p.coinId}
                  role="row"
                  className={`n-row-btn relative grid ${COLS} items-center min-h-[54px] text-sm ${
                    selected
                      ? "bg-[color-mix(in_srgb,var(--n-accent)_8%,transparent)]"
                      : ""
                  }`}
                  onClick={() => onSelect(p.coinId)}
                >
                  <span
                    role="cell"
                    className="flex items-center gap-2.5 min-w-0"
                  >
                    <CoinAvatar
                      image={p.coinImage}
                      name={p.coinName}
                      symbol={p.coinSymbol}
                      size={26}
                    />
                    <button
                      type="button"
                      className="min-w-0 truncate p-0 border-0 bg-transparent font-[inherit] font-medium text-(--n-text) cursor-pointer text-left hover:text-(--n-accent)"
                      aria-pressed={selected}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(p.coinId);
                      }}
                    >
                      {p.coinName}
                    </button>
                    <span className="text-[13px] text-(--n-neutral-500)">
                      {p.coinSymbol.toUpperCase()}
                    </span>
                  </span>
                  <span
                    role="cell"
                    className="text-right whitespace-nowrap text-(--n-neutral-300)"
                  >
                    {formatQuantity(p.amount)}
                  </span>
                  <span
                    role="cell"
                    className="text-right whitespace-nowrap text-(--n-neutral-300)"
                  >
                    {money(p.avgBuyPrice)}
                  </span>
                  <span role="cell" className="text-right whitespace-nowrap">
                    {money(p.currentPrice)}
                  </span>
                  <span
                    role="cell"
                    className="text-right whitespace-nowrap font-medium"
                  >
                    {money(p.value)}
                  </span>
                  <span
                    role="cell"
                    className="flex flex-col items-end leading-[1.3] whitespace-nowrap"
                    style={{ color: trendColor(p.pnl) }}
                  >
                    <span>{signedFiat(p.pnl, currency)}</span>
                    <span className="text-xs">
                      {formatSignedPercent(p.pnlPercent)}
                    </span>
                  </span>
                  <span role="cell" className="flex items-center gap-2.5 pl-6">
                    <span
                      aria-hidden="true"
                      className="flex-1 h-1 rounded-sm overflow-hidden bg-(--n-neutral-800)"
                    >
                      <span
                        className="block h-full bg-(--n-accent)"
                        style={{ width: `${Math.max(2, p.share)}%` }}
                      />
                    </span>
                    <span className="min-w-[42px] text-right text-xs text-(--n-neutral-400)">
                      {formatShare(p.share)}
                    </span>
                  </span>
                  <div
                    className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
                    style={{ background: ROW_RULE }}
                  />
                </div>
              );
            })}
          </div>

          <ul
            className="lg:hidden flex flex-col gap-px m-0 p-0 list-none rounded-lg overflow-hidden n-tnum"
            style={{
              background:
                "color-mix(in srgb, var(--n-text) 7%, var(--n-surface))",
            }}
          >
            {positions.map((p) => (
              <li key={p.coinId}>
                <button
                  type="button"
                  className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 w-full min-h-16 px-3.5 border-0 bg-(--n-surface) text-left font-[inherit] text-(--n-text) cursor-pointer"
                  aria-label={`${p.coinName} : passer un ordre`}
                  onClick={() => onSelect(p.coinId)}
                >
                  <CoinAvatar
                    image={p.coinImage}
                    name={p.coinName}
                    symbol={p.coinSymbol}
                    size={32}
                  />
                  <span className="flex flex-col leading-[1.35] min-w-0">
                    <span className="text-sm font-medium truncate">
                      {p.coinName}
                    </span>
                    <span className="text-xs text-(--n-neutral-500) truncate">
                      {formatQuantity(p.amount)} {p.coinSymbol.toUpperCase()} ·{" "}
                      {formatShare(p.share)}
                    </span>
                  </span>
                  <span className="flex flex-col items-end leading-[1.35]">
                    <span className="text-sm font-medium whitespace-nowrap">
                      {money(p.value)}
                    </span>
                    <span
                      className="text-xs whitespace-nowrap"
                      style={{ color: trendColor(p.pnl) }}
                    >
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
