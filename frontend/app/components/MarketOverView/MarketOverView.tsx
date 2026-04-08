"use client";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import React, { useEffect, useState } from "react";
import { getMarketView } from "@/app/lib/api/crypto";
import {
  formatPercentValue,
  getPercentColor,
} from "@/app/utils/Format/FormatPercent/FormatPercent";

import {
  CURRENCY_SYMBOLS,
  QUOTE_CURRENCY_SYMBOLS,
} from "@/app/utils/constants/currency";
import { formatNumberToCurrency } from "@/app/utils/Format/NumberFormat/NumberFormat";

export default function MarketOverView() {
  const [totalMarketCap, setTotalMarketCap] = useState<number>(0);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [marketCapPercentage, setMarketCapPercentage] = useState<number>(0);
  const [marketCapChange, setMarketCapChange] = useState<number>(0);
  const [volumeChange, setVolumeChange] = useState<number>(0);
  const { currency } = useCurrency();
  const symbol = CURRENCY_SYMBOLS[currency];
  const currency_quote = QUOTE_CURRENCY_SYMBOLS[currency];

  useEffect(() => {
    const getDataMarkerView = async () => {
      const data = await getMarketView(currency);
      console.log(data);
      if (!data) return;

      setTotalMarketCap(data.total_market_cap);
      setTotalVolume(data.total_volume);
      setMarketCapPercentage(data.market_cap_percentage);
      setMarketCapChange(data.market_cap_change_percentage_24h);
      setVolumeChange(data.volume_change_percentage_24h);
    };

    getDataMarkerView();
  }, [currency]);

  return (
    <section className="w-full border-b border-white/5 bg-card">
      <div className="px-2 py-2 flex flex-wrap items-center gap-6 text-sm text-foreground">
        {/* Market Cap */}
        <div className="flex items-center gap-2">
          <span>Market Cap</span>
          <span className="text-foreground font-medium">
            {formatNumberToCurrency(totalMarketCap)}
            {symbol}
          </span>
          <span
            className={getPercentColor(
              marketCapChange,
              "text-green-500",
              "text-red-500",
              "text-gray-500",
            )}
          >
            {formatPercentValue(marketCapChange)}
          </span>
        </div>

        <span className="text-muted">•</span>

        {/* 24h Volume */}
        <div className="flex items-center gap-2">
          <span>24h Volume</span>
          <span className="text-foreground font-medium">
            {formatNumberToCurrency(totalVolume)}
            {symbol}
          </span>
          <span
            className={getPercentColor(
              volumeChange,
              "text-green-500",
              "text-red-500",
              "text-gray-500",
            )}
          >
            {formatPercentValue(volumeChange)}
          </span>
        </div>

        <span className="text-muted">•</span>

        {/* BTC Dominance */}
        <div className="flex items-center gap-2">
          <span>BTC Dominance</span>
          <span
            className={`font-medium ${getPercentColor(
              marketCapPercentage,
              "text-green-500",
              "text-red-500",
              "text-gray-500",
            )}`}
          >
            {formatPercentValue(marketCapPercentage ?? 0)}
          </span>
        </div>
      </div>
    </section>
  );
}
