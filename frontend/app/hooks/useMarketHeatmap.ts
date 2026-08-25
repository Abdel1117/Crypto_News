"use client";

import { useCallback, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { getPrices } from "@/app/lib/features/prices/pricesThunks";
import { CryptoMarketData } from "@/app/ui/CryptoInfoCard/CryptoInfoCard";

interface UseMarketHeatmapResult {
  data: CryptoMarketData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Reads the live, WS-fed market coins from Redux and exposes them as a
 * top-`limit` list ready for the heatmap. `refresh()` forces an immediate
 * REST re-fetch instead of waiting for the next WS broadcast.
 */
export function useMarketHeatmap(
  currency: string,
  limit: number = 20,
): UseMarketHeatmapResult {
  const dispatch = useAppDispatch();
  const { coins, loading: pricesLoading } = useAppSelector(
    (state) => state.prices,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const data = useMemo(
    () =>
      [...coins]
        .filter(
          (coin) => typeof coin.market_cap === "number" && coin.market_cap > 0,
        )
        .sort((a, b) => b.market_cap - a.market_cap)
        .slice(0, limit),
    [coins, limit],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await dispatch(getPrices(currency)).unwrap();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Échec du rafraîchissement des données du marché.",
      );
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, currency]);

  return {
    data,
    loading: (pricesLoading || refreshing) && data.length === 0,
    error,
    refresh,
  };
}
