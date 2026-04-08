"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { getTopGainersLosers } from "@/app/lib/features/topGainersLosers/topGainersLosersThunks";
import { GainerLoserCoin } from "@/app/lib/features/topGainersLosers/topGainersLosersSlice";
import { getTrending } from "@/app/lib/features/trending/trendingThunks";
import { TrendingCoin } from "@/app/lib/features/trending/trendingSlice";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { CURRENCY_SYMBOLS } from "@/app/utils/constants/currency";
import {
  formatPercentValue,
  getPercentColor,
} from "@/app/utils/Format/FormatPercent/FormatPercent";
import { formatPrice } from "@/app/utils/Format/PriceFormat/PriceFormat";

type Tab = "gainers" | "losers" | "trending";

function MiniSparkline({
  data,
  positive,
}: {
  data: number[];
  positive: boolean;
}) {
  if (!data || data.length < 2) return null;
  const sampled =
    data.length > 30
      ? data.filter((_, i) => i % Math.ceil(data.length / 30) === 0)
      : data;
  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = sampled
    .map((v, i) => {
      const x = (i / (sampled.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="inline-block"
    >
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#16a34a" : "#dc2626"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CoinTable({
  coins,
  currencySymbol,
  onCoinSelect,
}: {
  coins: GainerLoserCoin[];
  currencySymbol: string;
  onCoinSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left table-fixed">
        <thead className="text-xs uppercase text-muted-foreground border-b border-white/10">
          <tr>
            <th className="px-4 py-3  w-[50px]">#</th>
            <th className="px-4 py-3">Nom</th>
            <th className="px-4 py-3 text-right">Prix {currencySymbol} </th>
            <th className="px-4 py-3 text-right">Variation 24h</th>
            <th className="px-4 py-3 text-right hidden sm:table-cell">
              Capitalisation
            </th>
            <th className="px-4 py-3 text-right hidden md:table-cell">
              7 jours
            </th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin, index) => (
            <tr
              key={coin.id}
              onClick={() => onCoinSelect(coin.id)}
              className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer "
            >
              <td className="px-4 py-3 text-muted-foreground ">{index + 1}</td>
              <td className="px-4 py-3 ">
                <div className="flex items-center gap-2">
                  {coin.image && (
                    <Image
                      src={coin.image}
                      alt={coin.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 shrink-0"
                    />
                  )}
                  <span className="font-medium text-foreground">
                    {coin.name}
                  </span>
                  <span className="text-muted-foreground font-semibold">
                    {coin.symbol}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right text-foreground ">
                {formatPrice(coin.price, 2, currencySymbol)}
              </td>
              <td
                className={`px-4 py-3 text-right font-medium ${getPercentColor(coin.price_change_percentage)}`}
              >
                {formatPercentValue(coin.price_change_percentage)}
              </td>
              <td className="px-4 py-3 text-right text-foreground hidden sm:table-cell ">
                {coin.market_cap?.toLocaleString()} {currencySymbol}
              </td>
              <td className="px-4 py-3 text-right hidden md:table-cell">
                <MiniSparkline
                  data={coin.sparkline}
                  positive={coin.price_change_percentage >= 0}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendingTable({
  coins,
  currencySymbol,
  onCoinSelect,
}: {
  coins: TrendingCoin[];
  currencySymbol: string;
  onCoinSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left table-fixed">
        <thead className="text-xs uppercase text-muted-foreground border-b border-white/10">
          <tr>
            <th className="px-4 py-3 w-[50px]">#</th>
            <th className="px-4 py-3 w-[32%]">Nom</th>
            <th className="px-4 py-3 text-right">Prix {currencySymbol} </th>
            <th className="px-4 py-3 text-right">Variation 24h</th>
            <th className="px-4 py-3 text-right hidden sm:table-cell">
              Capitalisation
            </th>
            <th className="px-4 py-3 text-right hidden md:table-cell">
              7 jours
            </th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin, index) => (
            <tr
              key={coin.id}
              onClick={() => onCoinSelect(coin.id)}
              className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
              <td className="px-4 py-3 w-[32%]">
                <div className="flex items-center gap-2">
                  {coin.image && (
                    <Image
                      src={coin.image}
                      alt={coin.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 shrink-0"
                    />
                  )}
                  <span className="font-medium text-foreground">
                    {coin.name}
                  </span>
                  <span className="text-muted-foreground">{coin.symbol}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right text-foreground">
                {typeof coin.price === "number"
                  ? `$${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                  : "—"}
              </td>
              <td
                className={`px-4 py-3 text-right font-medium ${
                  coin.price_change_24h != null
                    ? getPercentColor(coin.price_change_24h)
                    : "text-muted-foreground"
                }`}
              >
                {coin.price_change_24h != null
                  ? formatPercentValue(coin.price_change_24h)
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right text-foreground hidden sm:table-cell">
                {coin.market_cap ?? "—"}
              </td>
              <td className="px-4 py-3 text-right hidden md:table-cell">
                {coin.sparkline &&
                Array.isArray(coin.sparkline) &&
                coin.sparkline.length > 1 ? (
                  <MiniSparkline
                    data={coin.sparkline}
                    positive={(coin.price_change_24h ?? 0) >= 0}
                  />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TopGainersLosersProps {
  onSymbolChange: (symbolId: string) => void;
}

export default function TopGainersLosers({
  onSymbolChange,
}: TopGainersLosersProps) {
  const dispatch = useAppDispatch();
  const { currency } = useCurrency();
  const { topGainers, topLosers, loading, error } = useAppSelector(
    (state) => state.topGainersLosers,
  );
  const {
    coins: trendingCoins,
    loading: trendingLoading,
    error: trendingError,
  } = useAppSelector((state) => state.trending);
  const [activeTab, setActiveTab] = useState<Tab>("gainers");
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  useEffect(() => {
    dispatch(getTopGainersLosers(currency));
    dispatch(getTrending());
  }, [dispatch, currency]);

  const isLoading = activeTab === "trending" ? trendingLoading : loading;
  const currentError = activeTab === "trending" ? trendingError : error;
  const gainersLosersCoins = activeTab === "gainers" ? topGainers : topLosers;

  return (
    <div className="bg-card rounded-lg p-4">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Gagnants, Perdants & Tendance
        </h2>
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => setActiveTab("gainers")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-150 hover:cursor-pointer ${
              activeTab === "gainers"
                ? "bg-success/20 text-success"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Gagnants
          </button>
          <button
            onClick={() => setActiveTab("losers")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-150 hover:cursor-pointer ${
              activeTab === "losers"
                ? "bg-red-500/20 text-red-500"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Perdants
          </button>
          <button
            onClick={() => setActiveTab("trending")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-150 hover:cursor-pointer ${
              activeTab === "trending"
                ? "bg-yellow-500/20 text-yellow-500"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tendance 🔥
          </button>
        </div>
      </div>

      {isLoading && (
        <p className="text-muted-foreground text-center py-8">Chargement...</p>
      )}
      {currentError && (
        <p className="text-red-500 text-center py-8">{currentError}</p>
      )}
      {!isLoading && !currentError && activeTab === "trending" && (
        <TrendingTable
          coins={trendingCoins}
          currencySymbol={currencySymbol}
          onCoinSelect={onSymbolChange}
        />
      )}
      {!isLoading && !currentError && activeTab !== "trending" && (
        <CoinTable
          coins={gainersLosersCoins}
          currencySymbol={currencySymbol}
          onCoinSelect={onSymbolChange}
        />
      )}
    </div>
  );
}
