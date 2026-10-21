"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import {
  initSimulation,
  resetSimulation,
} from "@/app/lib/features/simulation/simulationSlice";
import { getPrices } from "@/app/lib/features/prices/pricesThunks";
import { getExchangeRate } from "@/app/lib/features/exchangeRate/exchangeRateThunks";
import { useIsDesktop, useMediaQuery } from "@/app/hooks/useMediaQuery";
import { HeaderActions } from "@/app/components/AppShell/HeaderSlots";
import PortfolioSummary from "@/app/components/Simulation/PortfolioSummary";
import PerformanceChart from "@/app/components/Simulation/PerformanceChart";
import Positions from "@/app/components/Simulation/Positions";
import TradeHistory from "@/app/components/Simulation/TradeHistory";
import TradeForm from "@/app/components/Simulation/TradeForm";
import OrderSheet from "@/app/components/Simulation/OrderSheet";
import {
  ArrowCounterClockwiseIcon,
  ArrowsLeftRightIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";

export default function SimulationPage() {
  const dispatch = useAppDispatch();
  const { currency } = useCurrency();
  const { coins } = useAppSelector((state) => state.prices);
  // ≥ lg: desktop layout; ≥ xl: the order form sits in a sticky side column.
  const isDesktop = useIsDesktop();
  const isWide = useMediaQuery("(min-width: 1280px)");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const allCoins = useMemo(() => (Array.isArray(coins) ? coins : []), [coins]);

  useEffect(() => {
    dispatch(initSimulation());
    dispatch(getExchangeRate());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getPrices(currency));
  }, [dispatch, currency]);

  const handleSymbolChange = (symbolId: string) => {
    setSelectedId(symbolId || null);
  };

  const handlePositionSelect = (coinId: string) => {
    setSelectedId(coinId);
    if (!isDesktop) setSheetOpen(true);
  };

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const resetPortfolio = (): void => {
    if (
      window.confirm(
        "Réinitialiser le portefeuille ? Toutes les positions et l'historique seront perdus.",
      )
    ) {
      dispatch(resetSimulation());
    }
  };

  const form = (
    <TradeForm
      coins={allCoins}
      selectedId={selectedId}
      handleSymbolChange={handleSymbolChange}
      inSheet={!isDesktop}
      onTraded={isDesktop ? undefined : closeSheet}
    />
  );

  return (
    <>
      <HeaderActions>
        <button
          type="button"
          onClick={resetPortfolio}
          className="n-btn n-btn-icon w-11! h-11! lg:w-auto! lg:h-auto! lg:px-1.5! lg:text-(--n-neutral-400)! lg:hover:text-(--n-text)!"
          aria-label="Réinitialiser le portefeuille"
        >
          <ArrowCounterClockwiseIcon size={isDesktop ? 16 : 20} />
          <span className="hidden lg:inline">Réinitialiser</span>
        </button>
      </HeaderActions>

      <div className="grid gap-[18px] lg:gap-4 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="flex flex-col gap-[18px] lg:gap-4 min-w-0">
          <PortfolioSummary
            coins={allCoins}
            chart={
              isDesktop ? undefined : (
                <PerformanceChart coins={allCoins} variant="compact" />
              )
            }
          />
          {isDesktop && <PerformanceChart coins={allCoins} />}
          {isDesktop && !isWide && form}
          <Positions
            coins={allCoins}
            selectedId={selectedId ?? ""}
            onSelect={handlePositionSelect}
          />
          <TradeHistory />
          {!isDesktop && (
            <button
              type="button"
              className="n-btn n-btn-primary w-full min-h-12 text-[15px]! bg-(--n-bg)!"
              onClick={() => setSheetOpen(true)}
            >
              <ArrowsLeftRightIcon />
              Passer un ordre
            </button>
          )}
        </div>

        {isWide && <div className="sticky top-4">{form}</div>}
      </div>

      {!isDesktop && (
        <OrderSheet open={sheetOpen} onClose={closeSheet}>
          {form}
        </OrderSheet>
      )}
    </>
  );
}
