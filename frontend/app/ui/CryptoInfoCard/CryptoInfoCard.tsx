import { Currency, useCurrency } from "@/app/context/Curency/CurrencyContext";
import Image from "next/image";
import React from "react";
import { formatPrice } from "@/app/utils/Format/PriceFormat/PriceFormat";
import {
  CURRENCY_SYMBOLS,
  QUOTE_CURRENCY_SYMBOLS,
} from "@/app/utils/constants/currency";
export interface CryptoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  market_cap: number;
  change_24h: number;
}

interface CryptoInfoCardProps {
  coin: CryptoMarketData;
}

export default function CryptoInfoCard({ coin }: CryptoInfoCardProps) {
  const isPositive = coin.change_24h > 0;
  const isNegative = coin?.change_24h < 0;
  const { currency } = useCurrency();
  const symbol = CURRENCY_SYMBOLS[currency];
  const currency_quote = QUOTE_CURRENCY_SYMBOLS[currency];
  return (
    <div className="bg-card border-l-3 border-primary rounded-lg p-4 min-w-[220px]">
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
        </div>
        <div className="flex items-center gap-2">
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
                  : "text-black"
            }
          >
            <polyline
              points="0,12 4,10 8,7 12,9 16,4 20,6 24,2"
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
        {formatPrice(coin.price, 2, symbol)}
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
          {isPositive ? "+" : ""}
          {coin.change_24h.toFixed(1)}%
        </span>
        <span className="text-muted">
          ({coin.symbol}/{currency_quote})
        </span>
      </div>
    </div>
  );
}
