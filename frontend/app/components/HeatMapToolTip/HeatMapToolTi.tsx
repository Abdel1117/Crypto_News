import { ComputedNode } from "@nivo/treemap";
import { HeatMapDatum } from "../HeatMap/HeatMapTreemap";
import { formatCurrencyCompact } from "@/app/utils/Format/CurrencyFormat/CurrencyFormat";
import { formatPrice } from "@/app/utils/Format/PriceFormat/PriceFormat";
import { formatPercentValue } from "@/app/utils/Format/FormatPercent/FormatPercent";
import { getHeatmapColor } from "@/app/utils/ColorsPicker/getHeatmapColor";

export default function HeatMapTooltip({
  node,
}: {
  node: ComputedNode<HeatMapDatum>;
}) {
  const d = node.data;
  const change = d.change24h ?? 0;
  const symbol = d.currencySymbol ?? "";

  return (
    <div
      className="text-sm rounded-md shadow-lg px-3 py-2 border border-primary/20 space-y-0.5"
      style={{
        color: "var(--color-foreground)",
        background: "var(--color-card)",
      }}
    >
      <div className="font-semibold">
        {d.fullName ?? d.name} ({d.symbol ?? d.name})
      </div>
      {typeof d.price === "number" && (
        <div className="text-muted">
          Prix : {formatPrice(d.price, symbol, 2)}
        </div>
      )}
      {typeof d.marketCap === "number" && (
        <div className="text-muted">
          Cap. marché : {formatCurrencyCompact(d.marketCap, symbol)}
        </div>
      )}
      {typeof d.volume24h === "number" && (
        <div className="text-muted">
          Volume 24h : {formatCurrencyCompact(d.volume24h, symbol)}
        </div>
      )}
      <div style={{ color: getHeatmapColor(change) }}>
        24h : {formatPercentValue(change)}
      </div>
    </div>
  );
}
