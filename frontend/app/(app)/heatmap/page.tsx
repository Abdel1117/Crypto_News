"use client";

import { useAppDispatch } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { setSelectedSymbol } from "@/app/lib/features/marketView/marketViewSlice";
import { useDenseMarketHeatmap } from "@/app/hooks/useDenseMarketHeatmap";
import HeatMapTreemap from "@/app/components/HeatMap/HeatMapTreemap";

const COIN_LIMIT = 50;

export default function HeatmapPage() {
  const dispatch = useAppDispatch();
  const { currency } = useCurrency();
  const { data, loading, error, refresh } = useDenseMarketHeatmap(
    currency,
    COIN_LIMIT,
  );

  const handleSelectCrypto = (id: string) => {
    dispatch(setSelectedSymbol(id));
  };

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex items-center flex-wrap justify-between gap-4 p-1">
        <div>
          <h1 className="text-3xl font-semibold">Heatmap du marché</h1>
          <p className="text-muted text-sm">
            Top {COIN_LIMIT} par capitalisation
          </p>
        </div>
        <button
          onClick={refresh}
          className="text-sm px-3 py-1.5 rounded-md border border-primary/30 text-foreground hover:bg-primary/10 transition-colors"
          type="button"
        >
          Rafraîchir
        </button>
      </div>
      <HeatMapTreemap
        coins={data}
        loading={loading}
        error={error}
        onRefresh={refresh}
        onSelectCrypto={handleSelectCrypto}
        heightClassName="h-[75vh] min-h-150"
      />
    </section>
  );
}
