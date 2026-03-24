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
import { fetchOhlcData } from "@/app/lib/features/marketView/marketViewThunk";

const mockTimeFrame: MarketViewState["selectedTimeFrame"][] = [
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
  const {
    ohlc: rawohlc,
    selectedSymbol,
    selectedTimeFrame,
  } = useAppSelector((state) => state.marketView);

  /* For CandleStick Element   */
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi>(null);
  const seriesRef = useRef<ISeriesApi>(null);
  const textColor = getCssVar("--color-foreground");

  // Charger les prix à chaque changement de monnaie
  useEffect(() => {
    dispatch(getPrices(currency));
  }, [currency, dispatch]);

  // Créer et mettre à jour le graphique
  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 600,
      height: 350,
      layout: { background: { color: "transparent" }, textColor: textColor },
      grid: {
        vertLines: { color: textColor },
        horzLines: { color: textColor },
      },
    });
    width: chartRef.current.applyOptions({
      crosshair: { mode: CrosshairMode.Normal },
    });
    seriesRef.current = chartRef.current.addSeries?.(CandlestickSeries, {});
    const ohlc = rawohlc.map((item) => ({
      time: Math.floor(item[0] / 1000),
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
    }));
    console.log("Nombre de bougies OHLC:", rawohlc.length, rawohlc);
    seriesRef.current.setData(ohlc);
    if (chartRef.current && ohlc.length > 0) {
      const logicalRange = {
        from: 0,
        to: ohlc.length - 1,
      };
      chartRef.current.timeScale().setVisibleLogicalRange(logicalRange);
    }
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [coins, symbols, rawohlc, containerWidth]);

  useEffect(() => {
    dispatch(
      fetchOhlcData({
        currency,
        selectedTimeFrame,
        cryptoId: selectedSymbol,
      }),
    );
  }, [currency, selectedTimeFrame, selectedSymbol]);

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
        {loading || !rawohlc || rawohlc.length === 0 ? (
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
