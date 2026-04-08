"use client";

import React from "react";
import { useAppSelector } from "@/app/lib/hooks";
import { CryptoMarketData } from "@/app/ui/CryptoInfoCard/CryptoInfoCard";

interface PortfolioChartProps {
  coins: CryptoMarketData[];
}

const COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export default function PortfolioChart({ coins }: PortfolioChartProps) {
  const { balance, holdings } = useAppSelector((state) => state.simulation);

  const segments = holdings
    .map((h) => {
      const coin = coins.find((c) => c.id === h.coinId);
      const price = coin?.price ?? h.avgBuyPrice;
      return {
        label: h.coinSymbol.toUpperCase(),
        value: h.amount * price,
      };
    })
    .filter((s) => s.value > 0);

  if (balance > 0) {
    segments.push({ label: "Cash", value: balance });
  }

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total <= 0) return null;

  const gradientParts = segments.reduce<{ parts: string[]; cum: number }>(
    (acc, seg, i) => {
      const pct = (seg.value / total) * 100;
      const start = acc.cum;
      const end = acc.cum + pct;
      acc.parts.push(
        `${COLORS[i % COLORS.length]} ${start}% ${end}%`,
      );
      return { parts: acc.parts, cum: end };
    },
    { parts: [], cum: 0 },
  );
  const gradient = gradientParts.parts.join(", ");

  return (
    <div className="bg-card rounded-lg p-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        Répartition du portefeuille
      </h3>
      <div className="flex items-center gap-6">
        <div
          className="w-28 h-28 rounded-full shrink-0"
          style={{
            background: `conic-gradient(${gradient})`,
          }}
        />
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {segments.map((seg, i) => (
            <div key={seg.label} className="flex items-center gap-1.5 text-sm">
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-foreground">
                {seg.label}{" "}
                <span className="text-muted-foreground">
                  {((seg.value / total) * 100).toFixed(1)}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
