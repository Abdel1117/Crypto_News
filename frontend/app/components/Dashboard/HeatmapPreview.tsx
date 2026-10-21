"use client";

import Link from "next/link";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { useMarketHeatmap } from "@/app/hooks/useMarketHeatmap";
import { ArrowRightIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import { formatSignedPercent } from "@/app/utils/Format/FrFormat/FrFormat";

// Fixed 6×4 layout for the 9 largest caps (rank order), as in the design:
// [grid-column, grid-row, label size desktop, label size mobile, change size mobile]
const SLOTS: [string, string, string, string, string][] = [
  ["1 / 4", "1 / 5", "16px", "14px", "11px"],
  ["4 / 6", "1 / 3", "14px", "13px", "11px"],
  ["6 / 7", "1 / 3", "12px", "10px", "9px"],
  ["4 / 5", "3 / 4", "12px", "10px", "9px"],
  ["5 / 6", "3 / 4", "12px", "10px", "9px"],
  ["6 / 7", "3 / 4", "12px", "10px", "9px"],
  ["4 / 5", "4 / 5", "12px", "10px", "9px"],
  ["5 / 6", "4 / 5", "12px", "10px", "9px"],
  ["6 / 7", "4 / 5", "12px", "10px", "9px"],
];

function tileBackground(change: number) {
  const k = Math.min(1, Math.abs(change) / 4);
  const color = change >= 0 ? "var(--n-up)" : "var(--n-down)";
  return `color-mix(in oklch, ${color} ${Math.round(14 + 30 * k)}%, var(--n-surface))`;
}

interface HeatmapPreviewProps {
  onSelect: (id: string) => void;
}

/** Compact, readable preview; the full treemap lives on /heatmap. */
export default function HeatmapPreview({ onSelect }: HeatmapPreviewProps) {
  const { currency } = useCurrency();
  const { data: coins, loading } = useMarketHeatmap(currency, SLOTS.length);

  return (
    <section
      className="n-panel flex flex-col gap-2.5 lg:gap-3 lg:flex-1 px-3.5 pt-3 pb-3.5 lg:px-4 lg:pt-3.5 lg:pb-4"
      aria-labelledby="heatmap-title"
    >
      <div className="flex items-center">
        <h2 id="heatmap-title" className="n-kicker m-0 font-normal!">
          Heatmap
        </h2>
        <Link
          href="/heatmap"
          className="ml-auto inline-flex items-center gap-1 min-h-8 text-[13px] no-underline"
        >
          Voir tout
          <ArrowRightIcon size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-6 grid-rows-4 gap-[3px] h-44 lg:h-auto lg:flex-1 lg:min-h-[200px]">
        {loading || coins.length === 0
          ? SLOTS.map(([col, row], i) => (
              <div
                key={i}
                className="n-skeleton rounded-sm!"
                style={{ gridColumn: col, gridRow: row }}
              />
            ))
          : coins.map((coin, i) => {
              const [col, row, fs, fsM, fsC] = SLOTS[i];
              const change = coin.change_24h ?? 0;
              return (
                <button
                  key={coin.id}
                  type="button"
                  className="flex flex-col items-center justify-center gap-px min-w-0 overflow-hidden rounded-sm border-0 cursor-pointer font-[inherit] text-(--n-text) hover:brightness-110"
                  style={
                    {
                      gridColumn: col,
                      gridRow: row,
                      background: tileBackground(change),
                      "--fs": fs,
                      "--fs-m": fsM,
                      "--fs-c": fsC,
                    } as React.CSSProperties
                  }
                  aria-label={`${coin.name} : ${formatSignedPercent(change)} sur 24 h`}
                  onClick={() => onSelect(coin.id)}
                >
                  <span className="font-medium text-(length:--fs-m) lg:text-(length:--fs)">
                    {coin.symbol.toUpperCase()}
                  </span>
                  <span className="n-tnum whitespace-nowrap text-(--n-neutral-200) text-(length:--fs-c) lg:text-[11px]">
                    {formatSignedPercent(change)}
                  </span>
                </button>
              );
            })}
      </div>
    </section>
  );
}
