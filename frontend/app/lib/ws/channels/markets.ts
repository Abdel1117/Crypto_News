/**
 * Channel handler: "markets"
 * Receives market data from WS and dispatches to Redux.
 */

import type { CryptoMarketData } from "@/app/ui/CryptoInfoCard/CryptoInfoCard";
import { setCoins, setConnected } from "@/app/lib/features/prices/pricesSlice";
import type { AppDispatch } from "@/app/lib/store";

export function registerMarketsChannel(dispatch: AppDispatch) {
  return (data: unknown) => {
    dispatch(setConnected(true));
    dispatch(setCoins(data as CryptoMarketData[]));
  };
}
