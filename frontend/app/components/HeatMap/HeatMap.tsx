"use client";

import { useMemo } from "react";
import { ResponsiveTreeMap, ComputedNode } from "@nivo/treemap";
import { useAppSelector } from "@/app/lib/hooks";

interface HeatMapDatum {
  name: string;
  value?: number;
  change24h?: number;
  children?: HeatMapDatum[];
}

function getChangeColor(change: number): string {
  if (change > 5) return "#15803d";
  if (change > 0) return "#16a34a";
  if (change === 0) return "#475569";
  if (change > -5) return "#dc2626";
  return "#991b1b";
}

function HeatMapTooltip({ node }: { node: ComputedNode<HeatMapDatum> }) {
  const change = node.data.change24h ?? 0;
  const isPositive = change > 0;

  return (
    <div
      className="bg-card text-foreground text-sm rounded-md shadow-lg px-3 py-2 border border-primary/20"
      style={{
        color: "var(--color-foreground)",
        background: "var(--color-card)",
      }}
    >
      <div className="font-semibold">{node.data.name}</div>
      <div className="text-muted">Cap. marché : {node.formattedValue}</div>
      <div style={{ color: getChangeColor(change) }}>
        {isPositive ? "+" : ""}
        {change.toFixed(1)}% (24h)
      </div>
    </div>
  );
}

export default function HeatMap() {
  const coins = useAppSelector((state) => state.prices.coins);

  const data = useMemo<HeatMapDatum>(
    () => ({
      name: "Market",
      children: coins
        .filter(
          (coin) => typeof coin.market_cap === "number" && coin.market_cap > 0,
        )
        .map((coin) => ({
          name: coin.symbol?.toUpperCase() ?? coin.id,
          value: coin.market_cap,
          change24h: coin.change_24h ?? 0,
        })),
    }),
    [coins],
  );

  if (!data.children || data.children.length === 0) {
    return (
      <div className="bg-card rounded-lg min-h-225 flex items-center justify-center text-muted">
        Chargement des données du marché...
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg  min-h-[100lvh]">
      <ResponsiveTreeMap
        data={data}
        identity="name"
        value="value"
        valueFormat=".02s"
        tile="squarify"
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        labelSkipSize={12}
        labelTextColor="var(--color-foreground)"
        parentLabelTextColor="var(--color-muted)"
        colors={(node) => getChangeColor(node.data.change24h ?? 0)}
        borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
        tooltip={HeatMapTooltip}
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
