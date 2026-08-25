"use client";

import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import dynamic from "next/dynamic";
import { send } from "@/app/lib/ws/socket";

import { useEffect, useState, useMemo } from "react";

import { useCurrency } from "@/app/context/Curency/CurrencyContext";

import { getMarketCoin } from "@/app/lib/features/prices/pricesThunks";
import { setSelectedSymbol } from "@/app/lib/features/marketView/marketViewSlice";
import { addSymbolIfMissing } from "@/app/lib/features/symbol/symbolSlice";
import { initWatchlist } from "@/app/lib/features/watchlist/watchlistSlice";

import CryptoInfoCard, {
  CryptoInfoCardData,
} from "@/app/ui/CryptoInfoCard/CryptoInfoCard";

import TopGainersLosers from "@/app/components/TopGainersLosers/TopGainersLosers";
import MarketOverView from "@/app/components/MarketOverView/MarketOverView";
import Loading from "./loading";
import HeatMap from "@/app/components/HeatMap/HeatMap";
const CandleStickGraph = dynamic(
  () => import("@/app/components/CandleStickGraph/CandleStickGraph"),
  { ssr: false },
);

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { currency } = useCurrency();
  const { coins, loading } = useAppSelector((state) => state.prices);
  const { symbols } = useAppSelector((state) => state.symbols);
  const { topGainers, topLosers } = useAppSelector(
    (state) => state.topGainersLosers,
  );
  const { coins: trendingCoins } = useAppSelector((state) => state.trending);
  const watchlistIds = useAppSelector((state) => state.watchlist.ids);

  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  const preferedNumberOfCrypto = 6;

  const priceMap = useMemo(
    () =>
      Array.isArray(coins)
        ? Object.fromEntries(coins.map((coin) => [coin.id, coin]))
        : {},
    [coins],
  );
  const symbolMap = useMemo(
    () => Object.fromEntries(symbols.map((symbol) => [symbol.id, symbol])),
    [symbols],
  );

  useEffect(() => {
    send({ currency });
  }, [currency]);

  useEffect(() => {
    dispatch(initWatchlist());
  }, [dispatch]);

  useEffect(() => {
    const missingWatchlistIds = watchlistIds.filter((id) => !priceMap[id]);
    missingWatchlistIds.forEach((id) => {
      dispatch(getMarketCoin({ currency, cryptoId: id }));
    });
  }, [dispatch, currency, watchlistIds, priceMap]);

  const topCrypto = Array.isArray(coins)
    ? coins.slice(0, preferedNumberOfCrypto)
    : [];

  const watchlistCoins: CryptoInfoCardData[] = watchlistIds
    .map((id) => priceMap[id] ?? symbolMap[id])
    .filter((coin) => coin !== undefined);

  const handleSymbolChange = (symbolId: string) => {
    setSelectedId(symbolId);
    dispatch(setSelectedSymbol(symbolId));

    if (!symbols.some((s) => s.id === symbolId)) {
      const allCoins = [
        ...coins.map((c) => ({
          id: c.id,
          name: c.name,
          symbol: c.symbol,
          image: c.image,
        })),
        ...topGainers.map((c) => ({
          id: c.id,
          name: c.name,
          symbol: c.symbol,
          image: c.image,
        })),
        ...topLosers.map((c) => ({
          id: c.id,
          name: c.name,
          symbol: c.symbol,
          image: c.image,
        })),
        ...trendingCoins.map((c) => ({
          id: c.id,
          name: c.name,
          symbol: c.symbol,
          image: c.image,
        })),
      ];
      const coin = allCoins.find((c) => c.id === symbolId);
      if (coin) {
        dispatch(addSymbolIfMissing(coin));
      }
    }
  };

  return (
    <section className="min-w-0 space-y-6">
      <h1 className="text-3xl font-semibold hidden">Dashboard</h1>
      {watchlistCoins?.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <span className="text-yellow-400">⭐</span> Your Watchlist
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ">
            {watchlistCoins?.map((coin) => (
              <CryptoInfoCard
                key={coin.id}
                coin={coin}
                selected={selectedId === coin.id}
                onSelect={() => handleSymbolChange(coin.id)}
              />
            ))}
          </div>
        </div>
      )}
      <MarketOverView />
      <div className="grid min-w-0  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ">
        {loading
          ? Array.from({ length: preferedNumberOfCrypto }).map((_, i) => (
              <Loading key={i} />
            ))
          : topCrypto.map((coin) => (
              <CryptoInfoCard
                key={coin.id}
                coin={coin}
                selected={selectedId === coin.id}
                onSelect={() => handleSymbolChange(coin.id)}
              />
            ))}
      </div>
      <CandleStickGraph symbols={symbols} onSymbolChange={handleSymbolChange} />
      <HeatMap onSelectCrypto={handleSymbolChange} />
      <TopGainersLosers onSymbolChange={handleSymbolChange} />
    </section>
  );
}
