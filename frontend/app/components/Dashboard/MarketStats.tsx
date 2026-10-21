"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { getMarketView } from "@/app/lib/api/crypto";
import {
  formatCompactFiat,
  formatSignedPercent,
} from "@/app/utils/Format/FrFormat/FrFormat";

interface MarketView {
  total_market_cap: number;
  total_volume: number;
  market_cap_percentage: number;
  market_cap_change_percentage_24h: number;
  volume_change_percentage_24h: number;
}

type Stat = { label: string; value: string; chg: string; color: string };

const trend = (v: number) =>
  v > 0 ? "var(--n-up)" : v < 0 ? "var(--n-down)" : "var(--n-neutral-400)";

export default function MarketStats() {
  const { currency } = useCurrency();
  const [data, setData] = useState<MarketView | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMarketView(currency)
      .then((view: MarketView | null) => {
        if (!cancelled && view) setData(view);
      })
      .catch(() => {
        /* the block simply stays on its placeholders */
      });
    return () => {
      cancelled = true;
    };
  }, [currency]);

  const stats: Stat[] = data
    ? [
        {
          label: "Capitalisation",
          value: formatCompactFiat(data.total_market_cap, currency),
          chg: formatSignedPercent(data.market_cap_change_percentage_24h),
          color: trend(data.market_cap_change_percentage_24h),
        },
        {
          label: "Volume 24 h",
          value: formatCompactFiat(data.total_volume, currency),
          chg: formatSignedPercent(data.volume_change_percentage_24h),
          color: trend(data.volume_change_percentage_24h),
        },
        {
          label: "Dominance BTC",
          value: data.market_cap_percentage
            .toLocaleString("fr-FR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })
            .concat(" %"),
          chg: "",
          color: "inherit",
        },
      ]
    : ["Capitalisation", "Volume 24 h", "Dominance BTC"].map((label) => ({
        label,
        value: "—",
        chg: "",
        color: "inherit",
      }));

  return (
    <section className="n-panel" aria-label="Marché">
      {/* Desktop: labelled rows */}
      <div className="hidden lg:flex flex-col px-4 pt-3.5 pb-1.5">
        <span className="n-kicker mb-1">Marché</span>
        <dl className="m-0">
          {stats.map((s) => (
            <div
              key={s.label}
              className="relative flex items-baseline gap-2.5 py-[9px] n-tnum"
            >
              <dt className="mr-auto text-[13px] text-(--n-neutral-400)">
                {s.label}
              </dt>
              <dd className="m-0 text-sm font-medium whitespace-nowrap">
                {s.value}
              </dd>
              <dd
                className="m-0 min-w-[54px] text-right text-xs"
                style={{ color: s.color }}
              >
                {s.chg}
              </dd>
              <div
                className="absolute inset-x-0 bottom-0 h-px"
                style={{
                  background:
                    "linear-gradient(to right, transparent, color-mix(in srgb, var(--n-text) 8%, transparent) 48px, color-mix(in srgb, var(--n-text) 8%, transparent) calc(100% - 48px), transparent)",
                }}
              />
            </div>
          ))}
        </dl>
      </div>

      {/* Mobile: three columns */}
      <dl className="lg:hidden m-0 grid grid-cols-3 gap-2.5 px-3.5 py-3">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5 min-w-0 n-tnum">
            <dt className="text-[11px] text-(--n-neutral-400) whitespace-nowrap">
              {s.label}
            </dt>
            <dd className="m-0 text-sm font-medium whitespace-nowrap">
              {s.value}
            </dd>
            <dd className="m-0 text-[11px] min-h-4" style={{ color: s.color }}>
              {s.chg}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
