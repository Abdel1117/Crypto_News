import { MarketViewState } from "@/app/lib/features/marketView/marketViewSlice";
import React from "react";

export interface RadiotTimeMarketProps {
  options: MarketViewState["selectedTimeframe"][];
  value: string | undefined;
  onChange: (timeFrame: MarketViewState["selectedTimeframe"]) => void;
  className?: string;
}

export default function RadiotTimeMarket({
  options,
  value,
  onChange,
  className = "",
}: RadiotTimeMarketProps) {
  return (
    <div className={`w-fit ${className}`}>
      <div className="flex gap-x-5 py-1">
        {options?.map((val, index) => (
          <button
            key={index}
            onClick={() => onChange(val)}
            className={`px-3 py-1 rounded 
              ${value === val ? "bg-primary text-white" : "bg-gray-200 text-black"}
              transition-colors`}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );
}
