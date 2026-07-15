"use client";

import React from "react";
import { useAppSelector } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { CURRENCY_SYMBOLS } from "@/app/utils/constants/currency";
import { formatPrice } from "@/app/utils/Format/PriceFormat/PriceFormat";
import Image from "next/image";

export default function TradeHistory() {
  const { currency } = useCurrency();
  const symbol = CURRENCY_SYMBOLS[currency];
  const { trades } = useAppSelector((state) => state.simulation);

  if (trades.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 text-center text-muted-foreground">
        Aucune transaction pour le moment.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-4">
      <h3 className="text-lg font-semibold text-foreground mb-3">
        Historique des transactions
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Crypto</th>
              <th className="px-3 py-2 text-right">Quantité</th>
              <th className="px-3 py-2 text-right">Prix</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr
                key={trade.id}
                className="border-b border-border/50 hover:bg-white/5 transition-colors"
              >
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                  {new Date(trade.date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      trade.type === "buy"
                        ? "bg-success/15 text-success"
                        : "bg-red-500/15 text-red-500"
                    }`}
                  >
                    {trade.type === "buy" ? "Achat" : "Vente"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {trade.coinImage && (
                      <Image
                        src={trade.coinImage}
                        alt={trade.coinName}
                        width={20}
                        height={20}
                        className="w-5 h-5"
                      />
                    )}
                    <span className="text-foreground">{trade.coinName}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-foreground">
                  {trade.amount.toFixed(6)}
                </td>
                <td className="px-3 py-2 text-right text-foreground">
                  {formatPrice(trade.priceAtTrade, symbol, 2)}
                </td>
                <td className="px-3 py-2 text-right font-medium text-foreground">
                  {formatPrice(trade.total, symbol, 2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
