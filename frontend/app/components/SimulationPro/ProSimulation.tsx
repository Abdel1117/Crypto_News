"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import {
  createPortfolio,
  fetchCountries,
  fetchPortfolio,
  fetchTrades,
} from "@/app/lib/features/simulationPro/simulationProThunks";
import { useIsDesktop, useMediaQuery } from "@/app/hooks/useMediaQuery";
import { HeaderActions } from "@/app/components/AppShell/HeaderSlots";
import OrderSheet from "@/app/components/Simulation/OrderSheet";
import { ArrowsLeftRightIcon, GearIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import OnboardingForm from "./OnboardingForm";
import PortfolioSettings from "./PortfolioSettings";
import ProPositions from "./ProPositions";
import ProSummary from "./ProSummary";
import ProTradeForm, { type CoinChoice } from "./ProTradeForm";
import ProTradeHistory from "./ProTradeHistory";
import StatsGrid from "./StatsGrid";
import TaxPanel from "./TaxPanel";
import ValueChart from "./ValueChart";

/** The logged-in simulation: onboarding, then the full dashboard. */
export default function ProSimulation() {
  const dispatch = useAppDispatch();
  const { status, portfolio, error, countries, trades, tradesTotal, saving, saveError } =
    useAppSelector((state) => state.simulationPro);
  const isDesktop = useIsDesktop();
  const isWide = useMediaQuery("(min-width: 1280px)");
  const [selected, setSelected] = useState<CoinChoice | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchCountries());
    dispatch(fetchPortfolio());
  }, [dispatch]);

  const portfolioId = portfolio?.id;
  useEffect(() => {
    if (portfolioId !== undefined) dispatch(fetchTrades());
  }, [dispatch, portfolioId]);

  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  if (status === "idle" || status === "loading") {
    return <div className="n-skeleton min-h-80" aria-busy="true" aria-label="Chargement du portefeuille" />;
  }

  if (status === "error" || (status !== "missing" && !portfolio)) {
    return (
      <div className="n-panel flex flex-col items-start gap-3 p-5" role="alert">
        <p className="m-0 text-sm">{error ?? "Impossible de charger ton portefeuille."}</p>
        <button type="button" className="n-btn n-btn-secondary" onClick={() => dispatch(fetchPortfolio())}>
          Réessayer
        </button>
      </div>
    );
  }

  if (status === "missing" || !portfolio) {
    return (
      <OnboardingForm
        countries={countries}
        mode="create"
        saving={saving}
        error={saveError}
        onSubmit={(settings) => dispatch(createPortfolio(settings))}
      />
    );
  }

  const selectPosition = (coinId: string) => {
    const p = portfolio.positions.find((x) => x.coin_id === coinId);
    if (!p) return;
    setSelected({ id: p.coin_id, symbol: p.symbol, name: p.name, image: p.image });
    if (!isDesktop) setSheetOpen(true);
  };

  const form = (
    <ProTradeForm
      portfolio={portfolio}
      selected={selected}
      onSelect={setSelected}
      inSheet={!isDesktop}
      onTraded={isDesktop ? undefined : closeSheet}
    />
  );
  const rule = countries.find((c) => c.code === portfolio.country);

  return (
    <>
      <HeaderActions>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="n-btn n-btn-icon w-11! h-11! lg:w-auto! lg:h-auto! lg:px-1.5! lg:text-(--n-neutral-400)! lg:hover:text-(--n-text)!"
          aria-label="Paramètres de la simulation"
        >
          <GearIcon size={isDesktop ? 16 : 20} />
          <span className="hidden lg:inline">Paramètres</span>
        </button>
      </HeaderActions>

      <div className="grid gap-4.5 lg:gap-4 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="flex flex-col gap-4.5 lg:gap-4 min-w-0">
          <ProSummary portfolio={portfolio} />
          <ValueChart portfolio={portfolio} />
          {isDesktop && !isWide && form}
          <ProPositions portfolio={portfolio} selectedId={selected?.id ?? null} onSelect={selectPosition} />
          <StatsGrid portfolio={portfolio} />
          <TaxPanel portfolio={portfolio} rule={rule} />
          <ProTradeHistory trades={trades} total={tradesTotal} currency={portfolio.currency} />
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
      {settingsOpen && (
        <PortfolioSettings portfolio={portfolio} countries={countries} onClose={closeSettings} />
      )}
    </>
  );
}
