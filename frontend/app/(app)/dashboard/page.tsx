"use client";

import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import CryptoInfoCard from "@/app/ui/CryptoInfoCard/CryptoInfoCard";
import dynamic from "next/dynamic";
const CandleStickGraph = dynamic(
  () => import("@/app/components/CandleStickGraph/CandleStickGraph"),
  { ssr: false },
);
import TopGainersLosers from "@/app/components/TopGainersLosers/TopGainersLosers";
import Loading from "./loading";
import { send } from "@/app/lib/ws/socket";
import { useEffect, useState, useMemo } from "react";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { getSymbols } from "@/app/lib/features/symbol/symbolThunks";
import { getMarketCoin } from "@/app/lib/features/prices/pricesThunks";
import MarketOverView from "@/app/components/MarketOverView/MarketOverView";
import { setSelectedSymbol } from "@/app/lib/features/marketView/marketViewSlice";
import {
  addSymbolIfMissing,
  readLocalSymbols,
  setSymbols as setSymbolsAction,
} from "@/app/lib/features/symbol/symbolSlice";
import { initWatchlist } from "@/app/lib/features/watchlist/watchlistSlice";

export default function DashboardPage() {
  const { currency } = useCurrency();
  const dispatch = useAppDispatch();
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
    dispatch(getSymbols(currency));
  }, [dispatch, currency]);

  useEffect(() => {
    dispatch(initWatchlist());
  }, [dispatch]);

  useEffect(() => {
    // load any locally persisted symbols added via the search UX
    const persisted = readLocalSymbols();
    if (persisted && persisted.length > 0) {
      dispatch(setSymbolsAction(persisted));

      const missingWatchlistIds = watchlistIds.filter((id) => !priceMap[id]);
      missingWatchlistIds.forEach((id) => {
        dispatch(getMarketCoin({ currency, cryptoId: id }));
      });
    }
  }, [dispatch, currency, watchlistIds, priceMap]);

  const topCrypto = Array.isArray(coins)
    ? coins.slice(0, preferedNumberOfCrypto)
    : [];

  const watchlistCoins = watchlistIds.reduce<
    Array<{
      id: string;
      symbol: string;
      name: string;
      image?: string;
      price?: number;
      market_cap?: number;
      change_24h?: number;
    }>
  >((acc, id) => {
    const coin = priceMap[id] ?? symbolMap[id];
    if (coin) {
      acc.push(
        coin as {
          id: string;
          symbol: string;
          name: string;
          image?: string;
          price?: number;
          market_cap?: number;
          change_24h?: number;
        },
      );
    }
    return acc;
  }, []);

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
      {watchlistCoins.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <span className="text-yellow-400">⭐</span> Your Watchlist
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ">
            {watchlistCoins.map((coin) => (
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
      <CandleStickGraph onSymbolChange={handleSymbolChange} />
      <TopGainersLosers onSymbolChange={handleSymbolChange} />
    </section>
  );
}
