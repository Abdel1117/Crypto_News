"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  createChart,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";
import { CrosshairMode } from "lightweight-charts";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { getPrices } from "@/app/lib/features/prices/pricesThunks";
import { getCssVar } from "@/app/utils/StyleFunctions/getCssVar";
import { callOhlc } from "@/app/lib/api/crypto";
import SymbolDropdown from "@/app/ui/SymbolDropdown/SymbolDropdown";
import RadioTimeMarket from "@/app/components/RadioTimeMarket/RadiotTimeMarket";
import {
  MarketViewState,
  setSelectedSymbol,
  setSelectedTimeframe,
} from "@/app/lib/features/marketView/marketViewSlice";

// Mock data OHLC pour test
const mockOhlc = [
  { time: 1710000000, open: 62000, high: 62500, low: 61500, close: 62200 },
  { time: 1710003600, open: 62200, high: 62400, low: 61800, close: 62050 },
  { time: 1710007200, open: 62050, high: 62300, low: 61900, close: 62100 },
  { time: 1710010800, open: 62100, high: 62600, low: 62000, close: 62500 },
  { time: 1710014400, open: 62500, high: 62800, low: 62400, close: 62700 },
  { time: 1710018000, open: 62700, high: 62900, low: 62600, close: 62850 },
];

const mockTimeFrame: MarketViewState["selectedTimeFrame"][] = [
  "1h",
  "1d",
  "1w",
  "1m",
  "1y",
];

export default function CandleStickGraph() {
  const { currency, setCurrency } = useCurrency();
  const dispatch = useAppDispatch();
  const { coins, loading } = useAppSelector((state) => state.prices);

  const { symbols, loading: loadingSymbol } = useAppSelector(
    (state) => state.symbols,
  );

  const [containerWidth, setContainerWidth] = useState(600);
  const { selectedSymbol, selectedTimeFrame } = useAppSelector(
    (state) => state.marketView,
  );

  /* Local State */
  /* ======== */
  /* For CandleStick Element   */
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi>(null);
  const seriesRef = useRef<ISeriesApi>(null);

  /* For the style of the candle light */
  const textColor = getCssVar("--color-foreground");

  // Charger les prix à chaque changement de monnaie
  useEffect(() => {
    dispatch(getPrices(currency));
  }, [currency, dispatch]);

  // Créer et mettre à jour le graphique
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Détruire l'ancien graphique si existant
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    // Créer le graphique
    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 600,
      height: 350,
      layout: { background: { color: "transparent" }, textColor: textColor },
      grid: {
        vertLines: { color: textColor },
        horzLines: { color: textColor },
      },
    });
    width: (containerWidth,
      chartRef.current.applyOptions({
        crosshair: { mode: CrosshairMode.Normal },
      }));

    seriesRef.current = chartRef.current.addSeries?.(CandlestickSeries, {});

    // Utilisation de mock data OHLC pour l'affichage
    seriesRef.current.setData(mockOhlc);

    // Nettoyage&
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [coins]);

  useEffect(() => {
    callOhlc();
  }, [selectedTimeFrame, selectedSymbol]);

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-card p-4 rounded-t-lg border-b border-border">
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
        <div className="flex  gap-2 w-full md:w-auto">
          <SymbolDropdown
            value={selectedSymbol}
            options={symbols}
            onChange={(id) => dispatch(setSelectedSymbol(id))}
            label={undefined}
            className="w-full md:w-auto"
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
      <div className="w-full min-h-[350px] rounded-lg p-1 md:p-2 o">
        {loading ? (
          <p>Chargement du graphique…</p>
        ) : (
          <div ref={chartContainerRef} style={{ width: "100%", height: 350 }} />
        )}
      </div>
      <div className="visible md:hidden">
        <RadioTimeMarket
          value={selectedTimeFrame}
          options={mockTimeFrame}
          onChange={(timeFrame: MarketViewState["selectedTimeFrame"]) =>
            dispatch(setSelectedTimeframe(timeFrame))
          }
        />
      </div>
    </div>
  );
}
