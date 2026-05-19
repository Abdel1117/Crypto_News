"use client";

import React, { useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  LineSeries,
  LineStyle,
} from "lightweight-charts";
import { useAppSelector } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { CURRENCY_SYMBOLS } from "@/app/utils/constants/currency";
import { CryptoMarketData } from "@/app/ui/CryptoInfoCard/CryptoInfoCard";
import { getCssVar } from "@/app/utils/StyleFunctions/GetCssVar";

interface PerformanceChartProps {
  coins: CryptoMarketData[];
}

export default function PerformanceChart({ coins }: PerformanceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const { currency } = useCurrency();
  const symbol = CURRENCY_SYMBOLS[currency];
  const { balance, holdings, initialBalance, portfolioSnapshots } =
    useAppSelector((state) => state.simulation);

  // Compute live portfolio value for the latest data point
  const holdingsValue = holdings.reduce((sum, h) => {
    const coin = coins.find((c) => c.id === h.coinId);
    const price = coin?.price ?? h.avgBuyPrice;
    return sum + h.amount * price;
  }, 0);
  const currentValue = balance + holdingsValue;

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const fg = getCssVar("--color-foreground");
    const border = getCssVar("--color-border");

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 260,
      layout: {
        background: { color: "transparent" },
        textColor: fg,
      },
      grid: {
        vertLines: { color: border, style: LineStyle.Dotted },
        horzLines: { color: border, style: LineStyle.Dotted },
      },
      rightPriceScale: {
        borderColor: border,
      },
      timeScale: {
        borderColor: border,
        timeVisible: true,
      },
      crosshair: { mode: 0 },
    });
    chartRef.current = chart;

    const lineSeries = chart.addSeries(LineSeries, {
      color: currentValue >= initialBalance ? "#22c55e" : "#ef4444",
      lineWidth: 2,
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });

    // Build data from snapshots + live point
    const points = portfolioSnapshots.map((s) => ({
      time: Math.floor(new Date(s.date).getTime() / 1000) as number,
      value: s.value,
    }));

    // Add live point
    const now = Math.floor(Date.now() / 1000);
    if (points.length === 0 || points[points.length - 1].time < now) {
      points.push({ time: now, value: currentValue });
    }

    // Deduplicate by time (keep last value for each timestamp)
    const deduped = new Map<number, number>();
    for (const p of points) {
      deduped.set(p.time, p.value);
    }
    const sorted = Array.from(deduped.entries())
      .sort(([a], [b]) => a - b)
      .map(([time, value]) => ({
        time: time as import("lightweight-charts").UTCTimestamp,
        value,
      }));

    lineSeries.setData(sorted);

    // Baseline reference line at initial balance
    const baselineSeries = chart.addSeries(LineSeries, {
      color: "#6b7280",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    if (sorted.length >= 2) {
      baselineSeries.setData([
        { time: sorted[0].time, value: initialBalance },
        { time: sorted[sorted.length - 1].time, value: initialBalance },
      ]);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [portfolioSnapshots, currentValue, initialBalance, symbol]);

  const pnlTotal = currentValue - initialBalance;
  const pnlPercent = initialBalance > 0 ? (pnlTotal / initialBalance) * 100 : 0;
  const isPositive = pnlTotal >= 0;

  return (
    <div className="bg-card rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Performance du portefeuille
        </h3>
        <span
          className={`text-sm font-semibold ${isPositive ? "text-success" : "text-red-500"}`}
        >
          {isPositive ? "+" : ""}
          {pnlPercent.toFixed(2)}%
        </span>
      </div>
      <div ref={chartContainerRef} />
    </div>
  );
}
