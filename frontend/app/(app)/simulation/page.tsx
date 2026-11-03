"use client";

import { useAppSelector } from "@/app/lib/hooks";
import BetaBanner from "@/app/components/Simulation/BetaBanner";
import BetaSimulation from "@/app/components/Simulation/BetaSimulation";
import ProSimulation from "@/app/components/SimulationPro/ProSimulation";

/**
 * Logged out: the browser-only beta. Logged in: the full simulation, saved on
 * the server, with the chosen capital, the country's tax and performance stats.
 */
export default function SimulationPage() {
  const { isAuthenticated, initializing } = useAppSelector((state) => state.auth);

  if (initializing) {
    return (
      <div className="n-skeleton min-h-80" aria-busy="true" aria-label="Chargement" />
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <BetaBanner />
        <BetaSimulation />
      </>
    );
  }

  return <ProSimulation />;
}
