"use client";

import React from "react";
import { useAppSelector } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { CURRENCY_SYMBOLS } from "@/app/utils/constants/currency";
import { formatPrice } from "@/app/utils/Format/PriceFormat/PriceFormat";
import InfoCard from "@/app/ui/InfoCard/InfoCard";
import { CryptoMarketData } from "@/app/ui/CryptoInfoCard/CryptoInfoCard";
import Image from "next/image";

interface PortfolioSummaryProps {
  coins: CryptoMarketData[];
}

export default function PortfolioSummary({ coins }: PortfolioSummaryProps) {
  const { currency } = useCurrency();
  const symbol = CURRENCY_SYMBOLS[currency];
  const { balance, initialBalance, holdings, realizedPnl } = useAppSelector(
    (state) => state.simulation,
  );
  const loading = useAppSelector((state) => state.prices.loading);

  const holdingsValue = holdings.reduce((sum, h) => {
    const coin = coins.find((c) => c.id === h.coinId);
    const price = coin?.price ?? h.avgBuyPrice;
    return sum + h.amount * price;
  }, 0);

  const totalValue = balance + holdingsValue;
  const unrealizedPnl = holdings.reduce((sum, h) => {
    const coin = coins.find((c) => c.id === h.coinId);
    const price = coin?.price ?? h.avgBuyPrice;
    return sum + (price - h.avgBuyPrice) * h.amount;
  }, 0);
  const pnl = totalValue - initialBalance;
  const pnlPercent = initialBalance > 0 ? (pnl / initialBalance) * 100 : 0;
  const isPositive = pnl >= 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoCard
          value={balance}
          symbol={symbol}
          label="Solde disponible"
          loading={loading}
        />
        <InfoCard
          value={totalValue}
          symbol={symbol}
          label="Valeur du portefeuille"
          loading={loading}
        />
        <div className="bg-card rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Profit / Perte</p>
          <p
            className={`text-2xl font-bold ${isPositive ? "text-success" : "text-red-500"}`}
          >
            {isPositive ? "+" : ""}
            {formatPrice(pnl, symbol, 2)} ({pnlPercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-4">
          <p className="text-sm text-muted-foreground">PnL non réalisé</p>
          <p
            className={`text-xl font-bold ${unrealizedPnl >= 0 ? "text-success" : "text-red-500"}`}
          >
            {unrealizedPnl >= 0 ? "+" : ""}
            {formatPrice(unrealizedPnl, symbol, 2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Positions ouvertes
          </p>
        </div>
        <div className="bg-card rounded-lg p-4">
          <p className="text-sm text-muted-foreground">PnL réalisé</p>
          <p
            className={`text-xl font-bold ${realizedPnl >= 0 ? "text-success" : "text-red-500"}`}
          >
            {realizedPnl >= 0 ? "+" : ""}
            {formatPrice(realizedPnl, symbol, 2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Positions clôturées
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
                      {h.amount.toFixed(6)} · {formatPrice(value, symbol, 2)}
                    </p>
                    <p
                      className={`text-xs ${holdingPositive ? "text-success" : "text-red-500"}`}
                    >
                      {holdingPositive ? "+" : ""}
                      {formatPrice(holdingPnl, symbol, 2)}
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
