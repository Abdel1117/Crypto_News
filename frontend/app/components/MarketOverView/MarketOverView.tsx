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

export default function MarketOverView() {
  const [totalMarketCap, setTotalMarketCap] = useState<null | number>(null);
  const [totalVolume, setTotalVolume] = useState<null | number>(null);
  const [marketCapPercentage, setMarketCapPercentage] = useState<null | number>(
    null,
  );
  const [marketCapChange, setMarketCapChange] = useState<null | number>(null);
  const [volumeChange, setVolumeChange] = useState<null | number>(null);
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
    <section className=" ">
      <div className=" grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
        {/* Market Cap */}
        <div className="bg-card border-l-3 border-primary rounded-lg p-4 md:min-w-[220px] w-full">
          <h2 className="text-foreground font-semibold text-sm mb-3">
            Market Cap
          </h2>
          <p className="text-foreground text-xl font-bold mb-2">
            {totalMarketCap}
            {symbol}
          </p>
          <span
            className={getPercentColor(
              marketCapChange,
              "text-success",
              "text-red-500",
              "text-neutral-500",
            )}
          >
            <p>{formatPercentValue(marketCapChange)}</p>
          </span>
        </div>
        {/* =========================== */}

        {/* 24H Volumes */}
        <div className="bg-card border-l-3 border-primary rounded-lg p-4 md:min-w-[220px] w-full">
          <h2 className="text-foreground font-semibold text-sm mb-3">
            24h Volume
          </h2>
          <p className="text-foreground text-xl font-bold mb-2">
            {totalVolume}
            {symbol}
          </p>
          <span
            className={getPercentColor(
              volumeChange,
              "text-success",
              "text-red-500",
              "text-neutral-500",
            )}
          >
            <p>{formatPercentValue(volumeChange)}</p>
          </span>
        </div>
        {/* ====================================== */}

        {/* BTC Dominance */}
        <div className="col-span-1 sm:col-span-2 md:col-span-1 flex flex-col flex-1 bg-card border-l-3 border-primary rounded-lg p-4 md:min-w-[220px]  w-full">
          <h2 className="text-foreground font-semibold text-sm mb-3">
            BTC Dominance
          </h2>
          <span
            className={getPercentColor(
              marketCapPercentage,
              "text-success",
              "text-red-500",
              "text-neutral-500",
            )}
          >
            <p>{formatPercentValue(marketCapPercentage ?? 0)}</p>
          </span>
        </div>
        {/* ====================================== */}
      </div>
    </section>
  );
}
