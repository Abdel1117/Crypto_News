"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaSeries,
  createChart,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useAppSelector } from "@/app/lib/hooks";
import { useTheme } from "@/app/context/Theme/ThemeContext";
import { callOhlc } from "@/app/lib/api/crypto";
import type { MarketViewState } from "@/app/lib/features/marketView/marketViewSlice";
import { CryptoMarketData } from "@/app/types/Crypto/Crypto";
import { usePortfolio } from "./usePortfolio";

type Period = "1w" | "1m" | "3m" | "all";

const PERIODS: { value: Period; label: string; full: string }[] = [
  { value: "1w", label: "1S", full: "1 semaine" },
  { value: "1m", label: "1M", full: "1 mois" },
  { value: "3m", label: "3M", full: "3 mois" },
  { value: "all", label: "Tout", full: "Tout l’historique" },
];

const DAY = 86400;
const PERIOD_SECONDS: Record<Period, number> = {
  "1w": 7 * DAY,
  "1m": 30 * DAY,
  "3m": 90 * DAY,
  all: Infinity,
};

// The OHLC endpoint knows 1d / 1w / 1m / 1y: 3M and "Tout" read the year.
const OHLC_TIMEFRAME: Record<Period, MarketViewState["selectedTimeFrame"]> = {
  "1w": "1w",
  "1m": "1m",
  "3m": "1y",
  all: "1y",
};

type Point = { time: UTCTimestamp; value: number };
type OhlcRow = [number, number, number, number, number];

function hexToRgba(hex: string, alpha: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = Number.parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Keeps the points inside the period, relative to the latest one. */
function clip(points: Point[], period: Period): Point[] {
  if (period === "all" || points.length === 0) return points;
  const from = points[points.length - 1].time - PERIOD_SECONDS[period];
  return points.filter((p) => p.time >= from);
}

interface PerformanceChartProps {
  coins: CryptoMarketData[];
  /** "card": titled panel with selectors (desktop); "compact": bare chart. */
  variant?: "card" | "compact";
}

/**
 * One chart for the portfolio value or, via the selector, the price of one of
 * the held coins.
 */
export default function PerformanceChart({
  coins,
  variant = "card",
}: PerformanceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const { theme } = useTheme();
  const snapshots = useAppSelector(
    (state) => state.simulation.portfolioSnapshots,
  );
  const { multiplier, totalValue, positions, currency } = usePortfolio(coins);

  const [subject, setSubject] = useState<string>("portfolio");
  const [period, setPeriod] = useState<Period>("all");
  const [coinPoints, setCoinPoints] = useState<Point[]>([]);
  const [coinError, setCoinError] = useState(false);

  // A coin that was sold falls back to the portfolio.
  const activeSubject =
    subject === "portfolio" || positions.some((p) => p.coinId === subject)
      ? subject
      : "portfolio";

  // Recorded snapshots, one point per second at most.
  const history: Point[] = useMemo(() => {
    const byTime = new Map<number, number>();
    for (const s of snapshots) {
      byTime.set(
        Math.floor(new Date(s.date).getTime() / 1000),
        s.value * multiplier,
      );
    }
    return Array.from(byTime.entries())
      .sort(([a], [b]) => a - b)
      .map(([time, value]) => ({ time: time as UTCTimestamp, value }));
  }, [snapshots, multiplier]);

  useEffect(() => {
    if (activeSubject === "portfolio") return;
    let cancelled = false;
    callOhlc(currency, OHLC_TIMEFRAME[period], activeSubject)
      .then((rows: unknown) => {
        if (cancelled) return;
        const data = Array.isArray(rows) ? (rows as OhlcRow[]) : [];
        setCoinPoints(
          data.map((r) => ({
            time: Math.floor(r[0] / 1000) as UTCTimestamp,
            value: r[4],
          })),
        );
        setCoinError(data.length === 0);
      })
      .catch(() => {
        if (!cancelled) {
          setCoinPoints([]);
          setCoinError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeSubject, period, currency]);

  // Build the chart once per theme / variant; data updates don't recreate it.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const css = getComputedStyle(container);
    const token = (name: string) => css.getPropertyValue(name).trim();
    const accent = token("--n-accent");
    const muted = token("--n-neutral-500");

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: "transparent" },
        textColor: muted,
        fontFamily: css.fontFamily,
        fontSize: variant === "compact" ? 10 : 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: hexToRgba(muted, 0.12) },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      crosshair: { mode: CrosshairMode.Magnet },
      handleScroll: variant === "card",
      handleScale: variant === "card",
      localization: {
        locale: "fr-FR",
        priceFormatter: (p: number) =>
          p.toLocaleString("fr-FR", {
            maximumFractionDigits: p < 1 ? 4 : p < 100 ? 2 : 0,
          }),
      },
    });
    seriesRef.current = chart.addSeries(AreaSeries, {
      lineColor: accent,
      lineWidth: 2,
      topColor: hexToRgba(accent, 0.26),
      bottomColor: hexToRgba(accent, 0),
      priceLineStyle: LineStyle.Dashed,
      priceLineColor: hexToRgba(accent, 0.6),
      lastValueVisible: variant === "card",
    });
    chartRef.current = chart;

    const observer = new ResizeObserver(([entry]) => {
      chart.resize(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [theme, variant]);

  useEffect(() => {
    if (!seriesRef.current) return;
    let points: Point[];
    if (activeSubject === "portfolio") {
      // Append the live value "now" (after the last snapshot).
      const lastTime = history.length ? history[history.length - 1].time : 0;
      const now = Math.max(Math.floor(Date.now() / 1000), lastTime + 1);
      points = [...history, { time: now as UTCTimestamp, value: totalValue }];
    } else {
      points = coinPoints;
    }
    seriesRef.current.setData(clip(points, period));
    chartRef.current?.timeScale().fitContent();
  }, [activeSubject, history, totalValue, coinPoints, period, theme, variant]);

  const chartBox = (
    <div className="relative">
      <div
        ref={containerRef}
        className={variant === "compact" ? "h-[150px]" : "h-[264px]"}
        role="img"
        aria-label={
          activeSubject === "portfolio"
            ? "Évolution de la valeur du portefeuille"
            : `Évolution du cours de ${
                positions.find((p) => p.coinId === activeSubject)?.coinName ??
                activeSubject
              }`
        }
      />
      {activeSubject !== "portfolio" && coinError && (
        <p
          role="status"
          className="absolute inset-0 m-0 grid place-items-center text-sm text-(--n-neutral-500)"
        >
          Historique indisponible pour cette crypto.
        </p>
      )}
    </div>
  );

  if (variant === "compact") return chartBox;

  return (
    <section
      className="n-panel flex flex-col gap-4 px-5 pt-4 pb-3.5"
      aria-labelledby="perf-title"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="perf-title" className="m-0 mr-auto text-base">
          Performance
        </h2>
        <div className="n-seg" role="group" aria-label="Courbe affichée">
          {[
            { id: "portfolio", label: "Portefeuille" },
            ...positions.map((p) => ({ id: p.coinId, label: p.coinName })),
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              className="n-seg-btn lg:flex-none! whitespace-nowrap"
              aria-pressed={activeSubject === s.id}
              onClick={() => setSubject(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="n-seg" role="group" aria-label="Période">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              className="n-seg-btn lg:flex-none!"
              aria-pressed={period === p.value}
              aria-label={p.full}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {chartBox}
    </section>
  );
}
