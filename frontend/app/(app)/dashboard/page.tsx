"use client";

import { useEffect, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import { send } from "@/app/lib/ws/socket";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";

import { getMarketCoin } from "@/app/lib/features/prices/pricesThunks";
import { setSelectedSymbol } from "@/app/lib/features/marketView/marketViewSlice";
import { addSymbolIfMissing } from "@/app/lib/features/symbol/symbolSlice";
import { initWatchlist } from "@/app/lib/features/watchlist/watchlistSlice";
import type { CoinSummary } from "@/app/types/Crypto/Crypto";

import Favorites from "@/app/components/Dashboard/Favorites";
import PriceChart from "@/app/components/Dashboard/PriceChart";
import MarketStats from "@/app/components/Dashboard/MarketStats";
import HeatmapPreview from "@/app/components/Dashboard/HeatmapPreview";
import MoversTable from "@/app/components/Dashboard/MoversTable";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { currency } = useCurrency();
  const { coins } = useAppSelector((state) => state.prices);
  const { symbols } = useAppSelector((state) => state.symbols);
  const { topGainers, topLosers } = useAppSelector(
    (state) => state.topGainersLosers,
  );
  const { coins: trendingCoins } = useAppSelector((state) => state.trending);
  const watchlistIds = useAppSelector((state) => state.watchlist.ids);
  const selectedSymbol = useAppSelector(
    (state) => state.marketView.selectedSymbol,
  );

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

  // Coins seen anywhere on the page, so a click on any of them can resolve
  // its name / icon even if it is not in the symbols store yet.
  const knownCoins = useMemo(
    () => [
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
    ],
    [coins, topGainers, topLosers, trendingCoins],
  );

  const watchlistCoins: CoinSummary[] = watchlistIds
    .map((id) => priceMap[id] ?? symbolMap[id])
    .filter((coin) => coin !== undefined);

  const selectedCoin: CoinSummary | undefined =
    priceMap[selectedSymbol] ??
    symbolMap[selectedSymbol] ??
    knownCoins.find((c) => c.id === selectedSymbol);

  const handleSymbolChange = (symbolId: string) => {
    dispatch(setSelectedSymbol(symbolId));
    if (!priceMap[symbolId]) {
      dispatch(getMarketCoin({ currency, cryptoId: symbolId }));
    }
    if (!symbols.some((s) => s.id === symbolId)) {
      const coin = knownCoins.find((c) => c.id === symbolId);
      if (coin) dispatch(addSymbolIfMissing(coin));
    }
    // On mobile the chart sits below the favourites: bring it into view.
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      document
        .getElementById("dashboard-chart")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex flex-col gap-[22px] lg:gap-6 min-w-0">
      <Favorites
        coins={watchlistCoins}
        selectedId={selectedSymbol}
        onSelect={handleSymbolChange}
      />

      <div className="grid gap-[22px] lg:gap-4 xl:grid-cols-[minmax(0,1fr)_360px] items-stretch">
        <div id="dashboard-chart" className="scroll-mt-4 flex flex-col min-w-0">
          <PriceChart coin={selectedCoin} />
        </div>
        <div className="flex flex-col gap-[22px] lg:gap-4 min-w-0 lg:max-xl:grid lg:max-xl:grid-cols-2">
          <MarketStats />
          <HeatmapPreview onSelect={handleSymbolChange} />
        </div>
      </div>

      <MoversTable onSelect={handleSymbolChange} />
    </div>
  );
}
