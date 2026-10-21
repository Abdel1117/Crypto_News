"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { getTopGainersLosers } from "@/app/lib/features/topGainersLosers/topGainersLosersThunks";
import { getTrending } from "@/app/lib/features/trending/trendingThunks";
import { toggleWatchlist } from "@/app/lib/features/watchlist/watchlistSlice";
import CoinAvatar from "@/app/ui/CoinAvatar/CoinAvatar";
import { isStablecoin } from "@/app/utils/constants/stablecoins";
import {
  StarIcon,
  StarOutlineIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";
import {
  formatCompactFiat,
  formatFiatPrice,
  formatSignedPercent,
} from "@/app/utils/Format/FrFormat/FrFormat";

type Tab = "gainers" | "losers" | "trending";

const TABS: { value: Tab; label: string }[] = [
  { value: "gainers", label: "Gagnants" },
  { value: "losers", label: "Perdants" },
  { value: "trending", label: "Tendances" },
];


/** Normalised row shared by the three tabs. */
interface MoverRow {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  price?: number;
  change?: number;
  marketCap?: number;
  sparkline?: number[];
}

function toNumber(v: unknown): number | undefined {
  const n =
    typeof v === "string" ? Number.parseFloat(v.replace(/[^\d.-]/g, "")) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

const trend = (v?: number) =>
  typeof v !== "number" || v === 0
    ? "var(--n-neutral-400)"
    : v > 0
      ? "var(--n-up)"
      : "var(--n-down)";

function Sparkline({ data }: { data?: number[] }) {
  if (!data || data.length < 2) {
    return <span className="text-(--n-neutral-500)">—</span>;
  }
  const step = Math.ceil(data.length / 42);
  const s = data.filter((_, i) => i % step === 0);
  const lo = Math.min(...s);
  const hi = Math.max(...s);
  const rg = hi - lo || 1;
  const points = s
    .map(
      (v, i) =>
        ((i / (s.length - 1)) * 100).toFixed(1) +
        "," +
        (2 + 28 * (1 - (v - lo) / rg)).toFixed(1),
    )
    .join(" ");
  const color = s[s.length - 1] >= s[0] ? "var(--n-up)" : "var(--n-down)";
  return (
    <svg
      width="96"
      height="26"
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        vectorEffect="non-scaling-stroke"
        style={{
          fill: "none",
          stroke: color,
          strokeWidth: 1.5,
          strokeLinejoin: "round",
        }}
      />
    </svg>
  );
}

const DESKTOP_COLS =
  "grid-cols-[44px_minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_132px_44px]";

interface MoversTableProps {
  onSelect: (id: string) => void;
}

export default function MoversTable({ onSelect }: MoversTableProps) {
  const dispatch = useAppDispatch();
  const { currency } = useCurrency();
  const watchlistIds = useAppSelector((state) => state.watchlist.ids);
  const { topGainers, topLosers, loading, error } = useAppSelector(
    (state) => state.topGainersLosers,
  );
  const {
    coins: trendingCoins,
    loading: trendingLoading,
    error: trendingError,
  } = useAppSelector((state) => state.trending);
  const [tab, setTab] = useState<Tab>("gainers");

  useEffect(() => {
    dispatch(getTopGainersLosers(currency));
    dispatch(getTrending());
  }, [dispatch, currency]);

  const rows: MoverRow[] = useMemo(() => {
    if (tab === "trending") {
      return trendingCoins.map((c) => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        image: c.image,
        price: toNumber(c.price),
        change: toNumber(c.price_change_24h),
        marketCap: toNumber(c.market_cap),
      }));
    }
    return (tab === "gainers" ? topGainers : topLosers)
      .filter((c) => !isStablecoin(c.symbol))
      .map((c) => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        image: c.image,
        price: c.price,
        change: c.price_change_percentage,
        marketCap: c.market_cap,
        sparkline: c.sparkline,
      }));
  }, [tab, trendingCoins, topGainers, topLosers]);

  const isLoading = tab === "trending" ? trendingLoading : loading;
  const currentError = tab === "trending" ? trendingError : error;

  const price = (v?: number) =>
    typeof v === "number" ? formatFiatPrice(v, currency) : "—";
  const cap = (v?: number) =>
    typeof v === "number" ? formatCompactFiat(v, currency) : "—";
  const pct = (v?: number) =>
    typeof v === "number" ? formatSignedPercent(v) : "—";

  const segment = (
    <div
      className="n-seg flex! lg:inline-flex! lg:ml-auto"
      role="group"
      aria-label="Classement"
    >
      {TABS.map((t) => (
        <button
          key={t.value}
          type="button"
          className="n-seg-btn lg:flex-none!"
          aria-pressed={tab === t.value}
          onClick={() => setTab(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  let body: React.ReactNode;
  if (isLoading) {
    body = (
      <div className="flex flex-col gap-2 py-2" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="n-skeleton h-11" />
        ))}
      </div>
    );
  } else if (currentError) {
    body = (
      <p className="m-0 py-6 text-center text-sm text-(--n-down)">
        {currentError}
      </p>
    );
  } else if (rows.length === 0) {
    body = (
      <p className="m-0 py-6 text-center text-sm text-(--n-neutral-400)">
        Aucune donnée pour le moment.
      </p>
    );
  } else {
    body = (
      <>
        {/* Desktop table */}
        <div
          role="table"
          aria-label="Classement des cryptos"
          className="hidden lg:flex flex-col n-tnum"
        >
          <div
            role="row"
            className={`grid ${DESKTOP_COLS} items-center py-1.5 text-[11px] tracking-[0.08em] uppercase text-[color-mix(in_srgb,var(--n-text)_60%,transparent)] relative`}
          >
            <span role="columnheader" className="pl-2">
              #
            </span>
            <span role="columnheader">Nom</span>
            <span role="columnheader" className="text-right">
              Prix
            </span>
            <span role="columnheader" className="text-right">
              24 h
            </span>
            <span role="columnheader" className="text-right">
              Capitalisation
            </span>
            <span role="columnheader" className="text-right">
              7 jours
            </span>
            <span role="columnheader" className="sr-only">
              Favori
            </span>
            <div className="n-rule top-auto! bottom-0" />
          </div>
          {rows.map((r, i) => {
            const fav = watchlistIds.includes(r.id);
            return (
              <div
                key={r.id}
                role="row"
                className={`n-row-btn relative grid ${DESKTOP_COLS} items-center min-h-[46px] text-sm`}
                onClick={() => onSelect(r.id)}
              >
                <span role="cell" className="pl-2 text-(--n-neutral-500)">
                  {i + 1}
                </span>
                <span role="cell" className="flex items-center gap-2.5 min-w-0">
                  <CoinAvatar
                    image={r.image}
                    name={r.name}
                    symbol={r.symbol}
                    size={24}
                  />
                  <button
                    type="button"
                    className="min-w-0 truncate p-0 border-0 bg-transparent font-[inherit] font-medium text-(--n-text) cursor-pointer text-left hover:text-(--n-accent)"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(r.id);
                    }}
                  >
                    {r.name}
                  </button>
                  <span className="text-[13px] text-(--n-neutral-500)">
                    {r.symbol.toUpperCase()}
                  </span>
                </span>
                <span role="cell" className="text-right whitespace-nowrap">
                  {tab === "trending" && typeof r.price === "number"
                    ? formatFiatPrice(r.price, "usd")
                    : price(r.price)}
                </span>
                <span
                  role="cell"
                  className="text-right"
                  style={{ color: trend(r.change) }}
                >
                  {pct(r.change)}
                </span>
                <span
                  role="cell"
                  className="text-right whitespace-nowrap text-(--n-neutral-300)"
                >
                  {tab === "trending" && typeof r.marketCap === "number"
                    ? formatCompactFiat(r.marketCap, "usd")
                    : cap(r.marketCap)}
                </span>
                <span role="cell" className="flex justify-end">
                  <Sparkline data={r.sparkline} />
                </span>
                <span role="cell" className="flex justify-end">
                  <button
                    type="button"
                    className={`n-btn n-btn-icon w-8! h-8! ${fav ? "text-(--n-accent)!" : "text-(--n-neutral-500)! hover:text-(--n-accent)!"}`}
                    aria-label={`${fav ? "Retirer" : "Ajouter"} ${r.name} ${fav ? "des" : "aux"} favoris`}
                    aria-pressed={fav}
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(toggleWatchlist(r.id));
                    }}
                  >
                    {fav ? <StarIcon /> : <StarOutlineIcon />}
                  </button>
                </span>
                <div
                  className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, color-mix(in srgb, var(--n-text) 8%, transparent) 48px, color-mix(in srgb, var(--n-text) 8%, transparent) calc(100% - 48px), transparent)",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Mobile list */}
        <ul
          className="lg:hidden flex flex-col gap-px m-0 p-0 list-none rounded-lg overflow-hidden n-tnum"
          style={{
            background:
              "color-mix(in srgb, var(--n-text) 7%, var(--n-surface))",
          }}
        >
          {rows.map((r, i) => (
            <li key={r.id}>
              <button
                type="button"
                className="grid grid-cols-[18px_28px_minmax(0,1fr)_auto] items-center gap-2.5 w-full min-h-14 px-3.5 border-0 bg-(--n-surface) text-left font-[inherit] text-(--n-text) cursor-pointer"
                onClick={() => onSelect(r.id)}
              >
                <span className="text-xs text-(--n-neutral-500)">{i + 1}</span>
                <CoinAvatar image={r.image} name={r.name} symbol={r.symbol} />
                <span className="flex flex-col leading-[1.3] min-w-0">
                  <span className="text-sm font-medium truncate">{r.name}</span>
                  <span className="text-xs text-(--n-neutral-500)">
                    {r.symbol.toUpperCase()}
                  </span>
                </span>
                <span className="flex flex-col items-end leading-[1.3]">
                  <span className="text-sm whitespace-nowrap">
                    {tab === "trending" && typeof r.price === "number"
                      ? formatFiatPrice(r.price, "usd")
                      : price(r.price)}
                  </span>
                  <span className="text-xs" style={{ color: trend(r.change) }}>
                    {pct(r.change)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <section
      className="flex flex-col gap-2.5 lg:rounded-lg lg:bg-(--n-surface) lg:px-5 lg:pt-4 lg:pb-2.5"
      aria-labelledby="movers-title"
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3">
        <div className="flex items-center gap-3">
          <h2 id="movers-title" className="m-0 text-base lg:text-[17px]">
            Gagnants, perdants et tendances
          </h2>
          {tab !== "trending" && (
            <span className="n-tag n-tag-neutral hidden lg:inline-flex">
              Hors stablecoins
            </span>
          )}
        </div>
        {segment}
      </div>
      {body}
    </section>
  );
}
