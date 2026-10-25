"use client";

import { useEffect, useRef, useState } from "react";
import {
  AreaSeries,
  CandlestickSeries,
  createChart,
  CrosshairMode,
  LineStyle,
  type Time,
} from "lightweight-charts";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { useTheme } from "@/app/context/Theme/ThemeContext";
import {
  MarketViewState,
  setSelectedTimeframe,
} from "@/app/lib/features/marketView/marketViewSlice";
import { fetchOhlcData } from "@/app/lib/features/marketView/marketViewThunk";
import type { CoinSummary } from "@/app/types/Crypto/Crypto";
import CoinAvatar from "@/app/ui/CoinAvatar/CoinAvatar";
import {
  ChartBarIcon,
  ChartLineIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";
import {
  formatFiatPrice,
  formatSignedPercent,
} from "@/app/utils/Format/FrFormat/FrFormat";
import { QUOTE_CURRENCY_SYMBOLS } from "@/app/utils/constants/currency";

type TimeFrame = MarketViewState["selectedTimeFrame"];
type ChartType = "line" | "candles";

const TIMEFRAMES: { value: TimeFrame; label: string; full: string }[] = [
  { value: "1d", label: "1J", full: "1 jour" },
  { value: "1w", label: "1S", full: "1 semaine" },
  { value: "1m", label: "1M", full: "1 mois" },
  { value: "1y", label: "1A", full: "1 an" },
];

type OhlcRow = [number, number, number, number, number];

/** Reads Nocturne tokens from the element so the chart follows the theme. */
function readTokens(el: HTMLElement) {
  const css = getComputedStyle(el);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    accent: v("--n-accent"),
    text: v("--n-neutral-500"),
    up: v("--n-up"),
    down: v("--n-down"),
    labelBg: v("--n-accent-800"),
  };
}

function hexToRgba(hex: string, alpha: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

interface PriceChartProps {
  coin?: CoinSummary;
}

export default function PriceChart({ coin }: PriceChartProps) {
  const dispatch = useAppDispatch();
  const { currency } = useCurrency();
  const { theme } = useTheme();
  const { ohlc, ohlcLoading, selectedSymbol, selectedTimeFrame } =
    useAppSelector((state) => state.marketView);
  const [chartType, setChartType] = useState<ChartType>("line");
  const containerRef = useRef<HTMLDivElement>(null);

  const rows: OhlcRow[] = Array.isArray(ohlc) ? (ohlc as OhlcRow[]) : [];
  const hasData = rows.length > 0;

  useEffect(() => {
    if (!selectedSymbol) return;
    dispatch(
      fetchOhlcData({ currency, selectedTimeFrame, cryptoId: selectedSymbol }),
    );
  }, [dispatch, currency, selectedTimeFrame, selectedSymbol]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || ohlcLoading || rows.length === 0) return;

    const t = readTokens(container);
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: "transparent" },
        textColor: t.text,
        fontFamily: getComputedStyle(container).fontFamily,
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: hexToRgba(t.text, 0.12) },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: selectedTimeFrame === "1d",
      },
      crosshair: { mode: CrosshairMode.Magnet },
      localization: {
        locale: "fr-FR",
        priceFormatter: (p: number) =>
          p.toLocaleString("fr-FR", {
            maximumFractionDigits: p < 1 ? 6 : p < 100 ? 2 : 0,
          }),
      },
    });

    const toTime = (ms: number) => Math.floor(ms / 1000) as Time;
    const lastPrice = {
      priceLineStyle: LineStyle.Dashed,
      priceLineColor: hexToRgba(t.accent, 0.6),
    };

    if (chartType === "line") {
      const series = chart.addSeries(AreaSeries, {
        lineColor: t.accent,
        lineWidth: 2,
        topColor: hexToRgba(t.accent, 0.26),
        bottomColor: hexToRgba(t.accent, 0),
        ...lastPrice,
      });
      series.setData(rows.map((r) => ({ time: toTime(r[0]), value: r[4] })));
    } else {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: t.up,
        downColor: t.down,
        wickUpColor: t.up,
        wickDownColor: t.down,
        borderVisible: false,
        ...lastPrice,
      });
      series.setData(
        rows.map((r) => ({
          time: toTime(r[0]),
          open: r[1],
          high: r[2],
          low: r[3],
          close: r[4],
        })),
      );
    }
    chart.timeScale().fitContent();

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      chart.resize(width, height);
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
    };
    // `rows` is derived from `ohlc`; theme is listed so colours are re-read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ohlc, ohlcLoading, chartType, theme, selectedTimeFrame]);

  const quote = QUOTE_CURRENCY_SYMBOLS[currency];
  const change = coin?.change_24h;
  const changeColor =
    typeof change !== "number" || change === 0
      ? "var(--n-neutral-400)"
      : change > 0
        ? "var(--n-up)"
        : "var(--n-down)";

  const timeframeSeg = (mobile: boolean) => (
    <div
      className={`n-seg ${mobile ? "flex! lg:hidden!" : "hidden! lg:inline-flex!"}`}
      role="group"
      aria-label="Période"
    >
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf.value}
          type="button"
          className="n-seg-btn lg:flex-none!"
          aria-pressed={selectedTimeFrame === tf.value}
          aria-label={tf.full}
          onClick={() => dispatch(setSelectedTimeframe(tf.value))}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );

  return (
    <section
      className="n-panel flex-1 flex flex-col gap-3.5 p-3.5 lg:gap-[18px] lg:px-5 lg:pt-[18px] lg:pb-3.5"
      aria-label={coin ? `Graphique ${coin.name}` : "Graphique"}
    >
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex flex-col gap-1 lg:gap-1.5 mr-auto min-w-0">
          <div className="flex items-center gap-2 text-[13px] lg:text-sm">
            {coin && (
              <CoinAvatar
                image={coin.image}
                name={coin.name}
                symbol={coin.symbol}
                size={22}
              />
            )}
            <span className="font-medium">{coin?.name ?? selectedSymbol}</span>
            {coin && (
              <span className="text-(--n-neutral-500)">
                {coin.symbol.toUpperCase()} / {quote}
              </span>
            )}
          </div>
          <div className="n-tnum flex items-baseline gap-2 lg:gap-2.5">
            <span className="text-[26px] lg:text-[30px] font-medium tracking-[-0.015em] whitespace-nowrap">
              {typeof coin?.price === "number"
                ? formatFiatPrice(coin.price, currency)
                : "—"}
            </span>
            {typeof change === "number" && (
              <>
                <span
                  className="text-[13px] lg:text-sm"
                  style={{ color: changeColor }}
                >
                  {formatSignedPercent(change)}
                </span>
                <span className="text-[13px] text-(--n-neutral-500)">24 h</span>
              </>
            )}
          </div>
        </div>
        {timeframeSeg(false)}
        <div className="n-seg" role="group" aria-label="Type de graphique">
          <button
            type="button"
            className="n-seg-btn gap-1.5"
            aria-pressed={chartType === "line"}
            onClick={() => setChartType("line")}
          >
            <ChartLineIcon size={14} />
            Ligne
          </button>
          <button
            type="button"
            className="n-seg-btn gap-1.5"
            aria-pressed={chartType === "candles"}
            onClick={() => setChartType("candles")}
          >
            <ChartBarIcon size={14} />
            Bougies
          </button>
        </div>
      </div>

      <div className="relative h-[220px] lg:h-auto lg:flex-1 lg:min-h-[300px]">
        {ohlcLoading || !hasData ? (
          <div
            className={`${ohlcLoading ? "n-skeleton" : ""} absolute inset-0 grid place-items-center text-sm text-(--n-neutral-500)`}
            role={ohlcLoading ? undefined : "status"}
          >
            {!ohlcLoading && "Données indisponibles pour cette période."}
          </div>
        ) : (
          <div ref={containerRef} className="absolute inset-0" />
        )}
      </div>

      {timeframeSeg(true)}
    </section>
  );
}
