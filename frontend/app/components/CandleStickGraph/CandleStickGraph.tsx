"use client";

import React, { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  createChart,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";
import { CrosshairMode } from "lightweight-charts";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { getCssVar } from "@/app/utils/StyleFunctions/GetCssVar";
import SymbolDropdown from "@/app/ui/SymbolDropdown/SymbolDropdown";
import RadioTimeMarket from "@/app/components/RadioTimeMarket/RadiotTimeMarket";
import {
  MarketViewState,
  setSelectedTimeframe,
} from "@/app/lib/features/marketView/marketViewSlice";
import { fetchOhlcData } from "@/app/lib/features/marketView/marketViewThunk";
import CandleStickSkeleton from "@/app/ui/Skeleton/CandleStickSkeleton/CandleStickSkeleton";
import { SymbolData } from "@/app/lib/features/symbol/symbolSlice";

const mockTimeFrame: MarketViewState["selectedTimeFrame"][] = [
  "1d",
  "1w",
  "1m",
  "1y",
];

interface CandleStickGraphProps {
  symbols: SymbolData[];
  onSymbolChange: (symbolId: string) => void;
}

export default function CandleStickGraph({
  symbols,
  onSymbolChange,
}: CandleStickGraphProps) {
  const { currency, setCurrency } = useCurrency();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.prices);
  const {
    ohlcLoading,
    ohlc: rawohlc,
    selectedSymbol,
    selectedTimeFrame,
  } = useAppSelector((state) => state.marketView);

  /* For CandleStick Element   */
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick">>(null);

  // Charger les données OHLC du symbole sélectionné
  useEffect(() => {
    if (selectedSymbol.length > 0) {
      dispatch(
        fetchOhlcData({
          currency,
          selectedTimeFrame,
          cryptoId: selectedSymbol,
        }),
      );
    }
  }, [currency, selectedTimeFrame, selectedSymbol, dispatch]);

  // Créer et mettre à jour le graphique
  useEffect(() => {
    if (
      ohlcLoading ||
      loading ||
      !rawohlc ||
      rawohlc.length === 0 ||
      !chartContainerRef.current
    ) {
      return;
    }

    const container = chartContainerRef.current;
    const textColor = getCssVar("--color-foreground");

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight || 350,
      layout: {
        background: { color: "transparent" },
        textColor,
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: "transparent" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
    });

    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {});
    seriesRef.current = series;

    const ohlc = rawohlc?.map((item) => ({
      time: Math.floor(
        item[0] / 1000,
      ) as unknown as import("lightweight-charts").Time,
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
    }));

    series.setData(ohlc);

    chart.timeScale().setVisibleLogicalRange({
      from: 0,
      to: ohlc.length - 1,
    });

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;

      chart.resize(width, height || 350);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [ohlcLoading, loading, rawohlc]);
  /* ===================================================== */

  return (
    <div>
      <div className="flex flex-wrap flex-col md:flex-row items-start md:items-center gap-4 bg-card p-4 rounded-t-lg border-b border-border">
        {/* Bloc monnaie */}
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <label
            htmlFor="currency-select"
            className="text-sm font-semibold text-foreground/80"
          >
            Monnaie :
          </label>
          <select
            id="currency-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as "eur" | "usd")}
            className="px-2 py-1 rounded border border-border bg-surface text-foreground focus:outline-none focus:ring focus:border-primary transition"
          >
            <option value="eur">EUR</option>
            <option value="usd">USD</option>
          </select>
        </div>
        {/* Bloc SymbolDropdown */}
        <div className="flex gap-2 w-full max-w-[280px] md:w-auto">
          <SymbolDropdown
            value={selectedSymbol}
            options={symbols}
            onChange={onSymbolChange}
            label={undefined}
            className="w-full"
          />
        </div>
        {/* Bloc RadioTimeMarket */}
        <div className="hidden md:flex items-center gap-2 w-full md:w-auto justify-end">
          <RadioTimeMarket
            value={selectedTimeFrame}
            options={mockTimeFrame}
            onChange={(timeFrame: MarketViewState["selectedTimeFrame"]) =>
              dispatch(setSelectedTimeframe(timeFrame))
            }
            className="shadow-sm"
          />
        </div>
      </div>
      <div className="w-full min-w-0 rounded-lg p-1 md:p-2 overflow-hidden">
        <div className="h-[350px] w-full min-w-0 overflow-hidden">
          {ohlcLoading || loading || !rawohlc || rawohlc?.length === 0 ? (
            <CandleStickSkeleton />
          ) : (
            <div ref={chartContainerRef} className="w-full h-full" />
          )}
        </div>
      </div>
      <div className="visible md:hidden ">
        <RadioTimeMarket
          value={selectedTimeFrame}
          options={mockTimeFrame}
          onChange={(timeFrame: MarketViewState["selectedTimeFrame"]) =>
            dispatch(setSelectedTimeframe(timeFrame))
          }
          className="mx-auto my-2"
        />
      </div>
    </div>
  );
}
