"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Currency } from "@/app/context/Curency/CurrencyContext";
import type { CryptoMarketData } from "@/app/types/Crypto/Crypto";
import CoinAvatar from "@/app/ui/CoinAvatar/CoinAvatar";
import { squarify, type TreemapRect } from "@/app/utils/Treemap/squarify";
import {
  formatCompactFiat,
  formatFiatPrice,
  formatSignedPercent,
} from "@/app/utils/Format/FrFormat/FrFormat";

/** Variation (in %) at which a tile reaches its full colour. */
export const HEATMAP_SCALE = 9;

export function tileBackground(change: number) {
  const k = Math.min(1, Math.abs(change) / HEATMAP_SCALE);
  const color = change >= 0 ? "var(--n-up)" : "var(--n-down)";
  return `color-mix(in oklch, ${color} ${Math.round(12 + 48 * k)}%, var(--n-surface))`;
}

const GAP = 2;
const TIP_WIDTH = 228;
const TIP_HEIGHT = 150;

interface MarketTreemapProps {
  coins: CryptoMarketData[];
  currency: Currency;
  onSelect: (id: string) => void;
}

type Rect = TreemapRect<CryptoMarketData>;

/**
 * Squarified treemap of the market: area = market cap, colour = 24 h change.
 * Labels stay horizontal, top-left, sized to the tile; small tiles show the
 * symbol only, then nothing — hover or focus gives the details.
 */
export default function MarketTreemap({
  coins,
  currency,
  onSelect,
}: MarketTreemapProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hovered, setHovered] = useState<Rect | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rects = useMemo(
    () =>
      squarify(
        [...coins].sort((a, b) => b.market_cap - a.market_cap),
        (c) => c.market_cap,
        size.w,
        size.h,
      ),
    [coins, size.w, size.h],
  );

  const tipPosition = (r: Rect) => {
    const left = Math.min(
      Math.max(4, r.x + r.w * 0.42),
      size.w - TIP_WIDTH - 4,
    );
    // Inside large tiles, under (or above) small ones.
    let top = r.h > TIP_HEIGHT + 80 ? r.y + 64 : r.y + r.h + 6;
    if (top + TIP_HEIGHT > size.h) top = Math.max(4, r.y - TIP_HEIGHT - 6);
    return { left, top };
  };

  return (
    <div
      ref={boxRef}
      className="relative w-full h-[560px] lg:h-[600px]"
      onMouseLeave={() => setHovered(null)}
    >
      {rects.map((r) => {
        const c = r.item;
        const sym = c.symbol.toUpperCase();
        const change = c.change_24h ?? 0;
        const fs = Math.max(
          10,
          Math.min(30, (r.w - 12) / (sym.length * 0.72 + 0.8), r.h / 3),
        );
        const showSym = r.w >= 34 && r.h >= 20;
        const showPct = r.w >= 52 && r.h >= 40;
        const showIcon = r.w >= 120 && r.h >= 80;
        const large = r.w > 120 && r.h > 80;
        return (
          <button
            key={c.id}
            type="button"
            className="absolute flex flex-col items-start overflow-hidden rounded-[3px] lg:rounded-[4px] border-0 cursor-pointer font-[inherit] text-left text-(--n-text) n-tnum hover:brightness-[1.18] focus-visible:z-10"
            style={{
              left: r.x + GAP / 2,
              top: r.y + GAP / 2,
              width: Math.max(0, r.w - GAP),
              height: Math.max(0, r.h - GAP),
              padding: large ? "10px 12px" : "4px 6px",
              background: tileBackground(change),
              boxShadow:
                hovered?.item.id === c.id
                  ? "inset 0 0 0 1.5px var(--n-text)"
                  : undefined,
            }}
            aria-label={`${c.name} (${sym}) : ${formatSignedPercent(change)} sur 24 h, capitalisation ${formatCompactFiat(c.market_cap, currency)}. Ouvrir le graphique`}
            onMouseEnter={() => setHovered(r)}
            onFocus={() => setHovered(r)}
            onBlur={() => setHovered(null)}
            onClick={() => onSelect(c.id)}
          >
            {showSym && (
              <span
                className="flex items-center gap-1.5 font-medium leading-[1.15] whitespace-nowrap"
                style={{ fontSize: Math.round(fs) }}
              >
                {showIcon && (
                  <CoinAvatar
                    image={c.image}
                    name={c.name}
                    symbol={c.symbol}
                    size={Math.round(Math.min(26, fs * 0.85))}
                  />
                )}
                {sym}
              </span>
            )}
            {showPct && (
              <span
                className="leading-[1.3] whitespace-nowrap text-(--n-neutral-200)"
                style={{ fontSize: Math.round(Math.max(10, fs * 0.55)) }}
              >
                {formatSignedPercent(change)}
              </span>
            )}
          </button>
        );
      })}

      {hovered && (
        <div
          aria-hidden="true"
          className="hidden lg:flex absolute z-20 flex-col gap-2.5 px-3.5 py-3 rounded-lg bg-(--n-surface) pointer-events-none n-tnum"
          style={{
            ...tipPosition(hovered),
            width: TIP_WIDTH,
            boxShadow:
              "inset 0 0 0 1px color-mix(in srgb, var(--n-text) 10%, transparent), var(--n-shadow-md)",
          }}
        >
          <div className="flex items-center gap-2">
            <CoinAvatar
              image={hovered.item.image}
              name={hovered.item.name}
              symbol={hovered.item.symbol}
              size={24}
            />
            <span className="text-sm font-medium truncate">
              {hovered.item.name}
            </span>
            <span className="text-xs text-(--n-neutral-500)">
              {hovered.item.symbol.toUpperCase()}
            </span>
          </div>
          <dl className="m-0 flex flex-col gap-1.5 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-(--n-neutral-400)">Prix</dt>
              <dd className="m-0">
                {formatFiatPrice(hovered.item.price, currency)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-(--n-neutral-400)">24 h</dt>
              <dd
                className="m-0"
                style={{
                  color:
                    (hovered.item.change_24h ?? 0) >= 0
                      ? "var(--n-up)"
                      : "var(--n-down)",
                }}
              >
                {formatSignedPercent(hovered.item.change_24h ?? 0)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-(--n-neutral-400)">Capitalisation</dt>
              <dd className="m-0">
                {formatCompactFiat(hovered.item.market_cap, currency)}
              </dd>
            </div>
          </dl>
          <span className="text-xs text-(--n-accent-300)">
            Cliquer pour ouvrir le graphique
          </span>
        </div>
      )}
    </div>
  );
}
