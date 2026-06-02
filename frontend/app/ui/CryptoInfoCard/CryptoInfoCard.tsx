import { Currency, useCurrency } from "@/app/context/Curency/CurrencyContext";
import Image from "next/image";
import React from "react";
import { formatPrice } from "@/app/utils/Format/PriceFormat/PriceFormat";
import {
  CURRENCY_SYMBOLS,
  QUOTE_CURRENCY_SYMBOLS,
} from "@/app/utils/constants/currency";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { toggleWatchlist } from "@/app/lib/features/watchlist/watchlistSlice";
export interface CryptoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  market_cap: number;
  change_24h: number;
}

export interface CryptoInfoCardData {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  price?: number;
  market_cap?: number;
  change_24h?: number;
}

interface CryptoInfoCardProps {
  coin: CryptoInfoCardData;
  selected: boolean;
  onSelect: () => void;
}

export default function CryptoInfoCard({
  coin,
  selected,
  onSelect,
}: CryptoInfoCardProps) {
  const hasChange = typeof coin.change_24h === "number";
  const changeValue = coin.change_24h ?? 0;
  const isPositive = hasChange && changeValue > 0;
  const isNegative = hasChange && changeValue < 0;
  const { currency } = useCurrency();
  const symbol = CURRENCY_SYMBOLS[currency];
  const currency_quote = QUOTE_CURRENCY_SYMBOLS[currency];
  const dispatch = useAppDispatch();
  const watchlistIds = useAppSelector((state) => state.watchlist.ids);
  const isInWatchlist = watchlistIds.includes(coin.id);

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleWatchlist(coin.id));
  };

  return (
    <div
      className={`bg-card rounded-lg p-4 min-w-55 cursor-pointer transition-shadow ${
        selected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      {/* Header: icon + name + sparkline + menu */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {coin?.image && (
            <Image
              src={coin?.image}
              className="w-6 h-6 shrink-0"
              alt={coin?.name}
              width={24}
              height={24}
            />
          )}
          <span className="text-foreground font-semibold text-sm">
            {coin.name}
          </span>
          {isInWatchlist && (
            <span className="text-[10px] font-medium bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
              Dans vos favoris
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Star toggle */}
          <button
            onClick={handleToggleWatchlist}
            className="transition-colors hover:scale-110"
            aria-label={
              isInWatchlist ? "Remove from watchlist" : "Add to watchlist"
            }
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={isInWatchlist ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              className={
                isInWatchlist
                  ? "text-yellow-400"
                  : "text-muted-foreground hover:text-yellow-400"
              }
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
          {/* Mini sparkline icon */}
          <svg
            width="24"
            height="14"
            viewBox="0 0 24 14"
            fill="none"
            className={
              isPositive
                ? "text-success"
                : isNegative
                  ? "text-red-600"
                  : "text-muted-foreground"
            }
          >
            <polyline
              points={
                isPositive
                  ? "0,12 4,10 8,7 12,9 16,4 20,6 24,2"
                  : "0,2 4,4 8,7 12,5 16,10 20,8 24,12"
              }
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* Menu dots */}
          <button className="text-muted hover:text-foreground transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="3" cy="8" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="13" cy="8" r="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Price */}
      <p className="text-foreground text-xl font-bold mb-2">
        {typeof coin.price === "number"
          ? formatPrice(coin.price, 2, symbol)
          : "N/A"}
      </p>

      {/* Change + pair */}
      <div className="flex items-center gap-2 text-sm">
        <span
          className={
            isPositive
              ? "text-success"
              : isNegative
                ? "text-red-500"
                : "text-danger"
          }
        >
          {hasChange
            ? `${isPositive ? "+" : ""}${changeValue.toFixed(1)}%`
            : "—"}
        </span>
        <span className="text-muted">
          ({coin.symbol}/{currency_quote})
        </span>
      </div>
    </div>
  );
}
