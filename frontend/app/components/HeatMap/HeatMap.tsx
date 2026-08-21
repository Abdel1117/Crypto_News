"use client";

import { useMemo } from "react";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { useMarketHeatmap } from "@/app/hooks/useMarketHeatmap";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { CURRENCY_SYMBOLS } from "@/app/utils/constants/currency";
import { formatPercentValue } from "@/app/utils/Format/FormatPercent/FormatPercent";
import HeatMapTooltip from "../HeatMapToolTip/HeatMapToolTi";
import { getHeatmapColor } from "@/app/utils/ColorsPicker/getHeatmapColor";

export interface HeatMapDatum {
  name: string;
  id?: string;
  symbol?: string;
  fullName?: string;
  marketCap?: number;
  price?: number;
  volume24h?: number;
  change24h?: number;
  currencySymbol?: string;
  children?: HeatMapDatum[];
}

interface HeatMapProps {
  onSelectCrypto?: (id: string) => void;
}

export default function HeatMap({ onSelectCrypto }: HeatMapProps) {
  const { currency } = useCurrency();
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const {
    data: coins,
    loading,
    error,
    refresh,
  } = useMarketHeatmap(currency, 20);

  const data = useMemo<HeatMapDatum>(
    () => ({
      name: "Market",
      children: coins.map((coin) => ({
        name: coin.symbol?.toUpperCase() ?? coin.id,
        id: coin.id,
        symbol: coin.symbol?.toUpperCase(),
        fullName: coin.name,
        marketCap: coin.market_cap,
        price: coin.price,
        volume24h: coin.volume_24h,
        change24h: coin.change_24h ?? 0,
        currencySymbol,
      })),
    }),
    [coins, currencySymbol],
  );

  if (error) {
    return (
      <div className="bg-card rounded-lg h-162.5 flex flex-col items-center justify-center gap-3 text-muted">
        <p>{error}</p>
        <button
          onClick={refresh}
          className="text-sm px-3 py-1.5 rounded-md border border-primary/30 text-foreground hover:bg-primary/10 transition-colors"
          type="button"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card rounded-lg h-162.5 animate-pulse flex items-center justify-center text-muted"></div>
    );
  }

  if (!data.children || data.children.length === 0) {
    return (
      <div className="bg-card rounded-lg h-162.5 flex items-center justify-center text-muted">
        Aucune donnée de marché disponible.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg h-162.5">
      <ResponsiveTreeMap
        data={data}
        identity="name"
        value="marketCap"
        valueFormat=".02s"
        tile="squarify"
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        labelSkipSize={28}
        label={(node) => {
          const symbol = node.data.symbol ?? node.data.name;
          const change = node.data.change24h ?? 0;
          return `${symbol}  ${formatPercentValue(change)}`;
        }}
        labelTextColor="var(--color-foreground)"
        parentLabelTextColor="var(--color-muted)"
        colors={(node) => getHeatmapColor(node.data.change24h ?? 0)}
        borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
        tooltip={HeatMapTooltip}
        onClick={(node) => {
          if (node.data.id) onSelectCrypto?.(node.data.id);
        }}
        theme={{
          text: { fill: "var(--color-foreground)" },
          tooltip: {
            container: {
              background: "var(--color-card)",
              color: "var(--color-foreground)",
            },
          },
        }}
      />
    </div>
  );
}
