"use client";

import { useMarketHeatmap } from "@/app/hooks/useMarketHeatmap";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import HeatMapTreemap from "./HeatMapTreemap";

export type { HeatMapDatum } from "./HeatMapTreemap";

interface HeatMapProps {
  onSelectCrypto?: (id: string) => void;
}

export default function HeatMap({ onSelectCrypto }: HeatMapProps) {
  const { currency } = useCurrency();
  const {
    data: coins,
    loading,
    error,
    refresh,
  } = useMarketHeatmap(currency, 20);

  return (
    <HeatMapTreemap
      coins={coins}
      loading={loading}
      error={error}
      onRefresh={refresh}
      onSelectCrypto={onSelectCrypto}
    />
  );
}
