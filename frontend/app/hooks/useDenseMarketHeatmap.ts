"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { getMarketHeatmap } from "@/app/lib/features/marketHeatmap/marketHeatmapThunks";
import { CryptoMarketData } from "@/app/types/Crypto/Crypto";

interface UseDenseMarketHeatmapResult {
  data: CryptoMarketData[];
  loading: boolean;
  error: string | null;
  updatedAt: number | null;
  refresh: () => void;
}

/**
 * REST-only fetch of the top-`limit` coins by market cap, kept in its own
 * Redux slice so it isn't overwritten by the WS "markets" broadcast (which
 * is hardcoded to the top 20 coins) the way `state.prices.coins` is.
 */
export function useDenseMarketHeatmap(
  currency: string,
  limit: number,
): UseDenseMarketHeatmapResult {
  const dispatch = useAppDispatch();
  const { coins, loading, error, updatedAt } = useAppSelector(
    (state) => state.marketHeatmap,
  );

  const refresh = useCallback(() => {
    dispatch(getMarketHeatmap({ currency, limit, requestedAt: Date.now() }));
  }, [dispatch, currency, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data: coins,
    loading: loading && coins.length === 0,
    error,
    updatedAt,
    refresh,
  };
}
