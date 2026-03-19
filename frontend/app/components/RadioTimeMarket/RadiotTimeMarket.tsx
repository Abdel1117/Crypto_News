import { MarketViewState } from "@/app/lib/features/marketView/marketViewSlice";
import React from "react";

export interface RadiotTimeMarketProps {
  options: MarketViewState["selectedTimeFrame"][];
  value: string | undefined;
  onChange: (timeFrame: MarketViewState["selectedTimeFrame"]) => void;
  className?: string;
}

export default function RadiotTimeMarket({
  options,
  value,
  onChange,
  className = "",
}: RadiotTimeMarketProps) {
  return (
    <div className={`w-fit h-full ${className} bg-surface rounded-xl`}>
      <div className="flex h-full gap-x-3">
        {options?.map((val, index) => (
          <button
            key={index}
            onClick={() => onChange(val)}
            className={`px-3 py-1 rounded hover:text-foreground hover:cursor-pointer 
              ${value === val ? "bg-primary text-foreground" : " bg-card text-foreground"}
              transition-colors`}
          >
            {val.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
