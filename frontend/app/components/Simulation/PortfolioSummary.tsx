"use client";

import React from "react";
import { useAppSelector } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { CURRENCY_SYMBOLS } from "@/app/utils/constants/currency";
import { formatPrice } from "@/app/utils/Format/PriceFormat/PriceFormat";
import { CryptoMarketData } from "@/app/ui/CryptoInfoCard/CryptoInfoCard";
import Image from "next/image";

interface PortfolioSummaryProps {
  coins: CryptoMarketData[];
}

export default function PortfolioSummary({ coins }: PortfolioSummaryProps) {
  const { currency } = useCurrency();
  const symbol = CURRENCY_SYMBOLS[currency];
  const { balance, initialBalance, holdings } = useAppSelector(
    (state) => state.simulation,
  );

  const holdingsValue = holdings.reduce((sum, h) => {
    const coin = coins.find((c) => c.id === h.coinId);
    const price = coin?.price ?? h.avgBuyPrice;
    return sum + h.amount * price;
  }, 0);

  const totalValue = balance + holdingsValue;
  const pnl = totalValue - initialBalance;
  const pnlPercent = initialBalance > 0 ? (pnl / initialBalance) * 100 : 0;
  const isPositive = pnl >= 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Solde disponible</p>
          <p className="text-2xl font-bold text-foreground">
            {formatPrice(balance, 2, symbol)}
          </p>
        </div>
        <div className="bg-card rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Valeur du portefeuille</p>
          <p className="text-2xl font-bold text-foreground">
            {formatPrice(totalValue, 2, symbol)}
          </p>
        </div>
        <div className="bg-card rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Profit / Perte</p>
          <p
            className={`text-2xl font-bold ${isPositive ? "text-success" : "text-red-500"}`}
          >
            {isPositive ? "+" : ""}
            {formatPrice(pnl, 2, symbol)} ({pnlPercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      {holdings.length > 0 && (
        <div className="bg-card rounded-lg p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Vos positions
          </h3>
          <div className="space-y-2">
            {holdings.map((h) => {
              const coin = coins.find((c) => c.id === h.coinId);
              const currentPrice = coin?.price ?? h.avgBuyPrice;
              const value = h.amount * currentPrice;
              const holdingPnl = (currentPrice - h.avgBuyPrice) * h.amount;
              const holdingPositive = holdingPnl >= 0;
              return (
                <div
                  key={h.coinId}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {h.coinImage && (
                      <Image
                        src={h.coinImage}
                        alt={h.coinName}
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                    )}
                    <div>
                      <span className="font-medium text-foreground">
                        {h.coinName}
                      </span>
                      <span className="text-muted-foreground text-xs ml-1">
                        {h.coinSymbol.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground">
                      {h.amount.toFixed(6)} · {formatPrice(value, 2, symbol)}
                    </p>
                    <p
                      className={`text-xs ${holdingPositive ? "text-success" : "text-red-500"}`}
                    >
                      {holdingPositive ? "+" : ""}
                      {formatPrice(holdingPnl, 2, symbol)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
