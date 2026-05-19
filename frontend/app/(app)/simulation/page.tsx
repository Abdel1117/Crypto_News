"use client";

import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import {
  initSimulation,
  resetSimulation,
} from "@/app/lib/features/simulation/simulationSlice";
import { getPrices } from "@/app/lib/features/prices/pricesThunks";
import PortfolioSummary from "@/app/components/Simulation/PortfolioSummary";
import TradeForm from "@/app/components/Simulation/TradeForm";
import TradeHistory from "@/app/components/Simulation/TradeHistory";
import PortfolioChart from "@/app/components/Simulation/PortfolioChart";
import PerformanceChart from "@/app/components/Simulation/PerformanceChart";
import WithdrawalForm from "@/app/components/Simulation/WithdrawalForm";

export default function SimulationPage() {
  const dispatch = useAppDispatch();
  const { currency } = useCurrency();
  const { coins } = useAppSelector((state) => state.prices);

  useEffect(() => {
    dispatch(initSimulation());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getPrices(currency));
  }, [dispatch, currency]);

  const allCoins = Array.isArray(coins) ? coins : [];
  const resetSimultation = (): void => {
    if (
      window.confirm(
        "Réinitialiser le portefeuille ? Toutes les positions et l'historique seront perdus.",
      )
    ) {
      dispatch(resetSimulation());
    }
  };
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          Portefeuille virtuel
        </h1>
        <button
          onClick={() => {
            resetSimultation();
          }}
          className="text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-red-500 transition-colors cursor-pointer"
        >
          Réinitialiser
        </button>
      </div>

      <PortfolioSummary coins={allCoins} />

      {/* Performance du portefeuille */}
      <PerformanceChart coins={allCoins} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <TradeForm coins={allCoins} />
          <PortfolioChart coins={allCoins} />
          <WithdrawalForm />
        </div>
        <div className="lg:col-span-2">
          <TradeHistory />
        </div>
      </div>
    </section>
  );
}
