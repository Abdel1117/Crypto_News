"use client";

import React, { useEffect, useRef } from "react";
import { CandlestickSeries, createChart } from "lightweight-charts";
import { CrosshairMode } from "lightweight-charts";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { getPrices } from "@/app/lib/features/prices/pricesThunks";

// Mock data OHLC pour test
const mockOhlc = [
  { time: 1710000000, open: 62000, high: 62500, low: 61500, close: 62200 },
  { time: 1710003600, open: 62200, high: 62400, low: 61800, close: 62050 },
  { time: 1710007200, open: 62050, high: 62300, low: 61900, close: 62100 },
  { time: 1710010800, open: 62100, high: 62600, low: 62000, close: 62500 },
  { time: 1710014400, open: 62500, high: 62800, low: 62400, close: 62700 },
  { time: 1710018000, open: 62700, high: 62900, low: 62600, close: 62850 },
];

export default function CandleStickGraph() {
  const { currency, setCurrency } = useCurrency();
  const dispatch = useAppDispatch();
  const coins = useAppSelector((state) => state.prices.coins);
  const loading = useAppSelector((state) => state.prices.loading);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  // Charger les prix à chaque changement de monnaie
  useEffect(() => {
    dispatch(getPrices(currency));
    console.log(coins);
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
      layout: { background: { color: "#fff" }, textColor: "#222" },
      grid: { vertLines: { color: "#eee" }, horzLines: { color: "#eee" } },
    });
    // Appliquer l'option crosshair après la création
    chartRef.current.applyOptions({
      crosshair: { mode: CrosshairMode.Normal },
    });

    seriesRef.current = chartRef.current.addSeries?.(CandlestickSeries, {});

    // Utilisation de mock data OHLC pour l'affichage
    seriesRef.current.setData(mockOhlc);

    // Nettoyage
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [coins]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <label htmlFor="currency-select">Monnaie :</label>
        <select
          id="currency-select"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as "eur" | "usd")}
        >
          <option value="eur">EUR</option>
          <option value="usd">USD</option>
        </select>
      </div>
      <div
        style={{
          width: "100%",
          minHeight: 350,
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 8px #0001",
          padding: 8,
        }}
      >
        {loading ? (
          <p>Chargement du graphique…</p>
        ) : (
          <div ref={chartContainerRef} style={{ width: "100%", height: 350 }} />
        )}
      </div>
    </div>
  );
}
