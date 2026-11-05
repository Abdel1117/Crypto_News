"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  createChart,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useTheme } from "@/app/context/Theme/ThemeContext";
import type { ProPortfolio } from "@/app/lib/api/simulationPro";
import { hexToRgba } from "@/app/utils/Chart/hexToRgba";

/** Portfolio value, one point per day since creation, against the starting capital. */
export default function ValueChart({ portfolio }: Readonly<{ portfolio: ProPortfolio }>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const { theme } = useTheme();
  const { history, initial_capital: initial } = portfolio;

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
        fontSize: 11,
        attributionLogo: false,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: hexToRgba(muted, 0.12) } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      crosshair: { mode: CrosshairMode.Magnet },
      localization: {
        locale: "fr-FR",
        priceFormatter: (p: number) => p.toLocaleString("fr-FR", { maximumFractionDigits: 0 }),
      },
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: accent,
      lineWidth: 2,
      topColor: hexToRgba(accent, 0.26),
      bottomColor: hexToRgba(accent, 0),
      priceLineVisible: false,
    });
    series.createPriceLine({
      price: initial,
      color: hexToRgba(muted, 0.8),
      lineStyle: LineStyle.Dashed,
      lineWidth: 1,
      axisLabelVisible: false,
      title: "Capital de départ",
    });
    chartRef.current = chart;
    seriesRef.current = series;

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
  }, [theme, initial]);

  useEffect(() => {
    seriesRef.current?.setData(
      history.map((p) => ({
        time: (Date.parse(`${p.day}T00:00:00Z`) / 1000) as UTCTimestamp,
        value: p.value,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [history, theme, initial]);

  return (
    <section className="n-panel flex flex-col gap-3 px-5 pt-4 pb-3.5" aria-labelledby="value-chart-title">
      <h2 id="value-chart-title" className="m-0 text-base">
        Valeur dans le temps
      </h2>
      <figure className="relative m-0">
        {/* The canvas says nothing to a screen reader: the caption describes it. */}
        <div ref={containerRef} className="h-60" aria-hidden="true" />
        <figcaption className="sr-only">Évolution de la valeur du portefeuille, un point par jour</figcaption>
        {history.length < 2 && (
          <output className="block absolute inset-x-0 bottom-3 m-0 text-center text-sm text-(--n-neutral-500)">
            La courbe se construit jour après jour : reviens demain pour voir l&apos;évolution.
          </output>
        )}
      </figure>
    </section>
  );
}
