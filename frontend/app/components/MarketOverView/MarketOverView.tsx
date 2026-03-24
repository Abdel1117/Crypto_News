"use client";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import React, { useEffect, useState } from "react";
import { getMarketView } from "@/app/lib/api/crypto";

export default function MarketOverView() {
  const [totalMarketCap, setTotalMarketCap] = useState(null);
  const [totalVolume, setTotalVolume] = useState(null);
  const [marketCapPercentage, setMarketCapPercentage] = useState(null);
  const [marketCapChange, setMarketCapChange] = useState(null);
  const [volumeChange, setVolumeChange] = useState(null);
  const { currency } = useCurrency();

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

  const isPositive = true;
  const isNegative = false;
  return (
    <section className=" ">
      <div className=" grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
        <div className="bg-card border-l-3 border-primary rounded-lg p-4 md:min-w-[220px] w-full">
          <h2 className="text-foreground font-semibold text-sm mb-3">
            Market Cap
          </h2>
          <p className="text-foreground text-xl font-bold mb-2">
            {totalMarketCap}
            {currency}
          </p>
          <span
            className={
              isPositive
                ? "text-success"
                : isNegative
                  ? "text-red-500"
                  : "text-danger"
            }
          >
            <p>+2.1%</p>
          </span>
        </div>

        <div className="bg-card border-l-3 border-primary rounded-lg p-4 md:min-w-[220px] w-full">
          <h2 className="text-foreground font-semibold text-sm mb-3">
            24h Volume
          </h2>
          <p className="text-foreground text-xl font-bold mb-2">
            {totalVolume}
            {currency}
          </p>
          <span
            className={
              isPositive
                ? "text-success"
                : isNegative
                  ? "text-red-500"
                  : "text-danger"
            }
          >
            <p>-5.4%</p>
          </span>
        </div>

        <div className="col-span-1 sm:col-span-2 md:col-span-1 flex flex-col flex-1 bg-card border-l-3 border-primary rounded-lg p-4 md:min-w-[220px]  w-full">
          <h2 className="text-foreground font-semibold text-sm mb-3">
            BTC Dominance
          </h2>
          <p className="text-foreground text-xl font-bold mb-2">52.3%</p>
          <span
            className={
              isPositive
                ? "text-success"
                : isNegative
                  ? "text-red-500"
                  : "text-danger"
            }
          >
            <p>{marketCapPercentage} %</p>
          </span>
        </div>
      </div>
    </section>
  );
}
