"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { executeTrade } from "@/app/lib/features/simulation/simulationSlice";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { CURRENCY_SYMBOLS } from "@/app/utils/constants/currency";
import { formatPrice } from "@/app/utils/Format/PriceFormat/PriceFormat";
import { CryptoMarketData } from "@/app/ui/CryptoInfoCard/CryptoInfoCard";

interface TradeFormProps {
  coins: CryptoMarketData[];
}

export default function TradeForm({ coins }: TradeFormProps) {
  const dispatch = useAppDispatch();
  const { currency } = useCurrency();
  const symbol = CURRENCY_SYMBOLS[currency];
  const { balance, holdings } = useAppSelector((state) => state.simulation);

  const [selectedCoinId, setSelectedCoinId] = useState("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");

  const sellableCoins = coins.filter((c) =>
    holdings.some((h) => h.coinId === c.id),
  );
  const availableCoins = tradeType === "sell" ? sellableCoins : coins;

  const selectedCoin = coins.find((c) => c.id === selectedCoinId);
  const holding = holdings.find((h) => h.coinId === selectedCoinId);
  const numAmount = parseFloat(amount) || 0;
  const total = selectedCoin ? numAmount * selectedCoin.price : 0;

  const canTrade =
    selectedCoin &&
    numAmount > 0 &&
    (tradeType === "buy"
      ? total <= balance
      : holding && numAmount <= holding.amount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoin || !canTrade) return;
    dispatch(
      executeTrade({
        coinId: selectedCoin.id,
        coinName: selectedCoin.name,
        coinSymbol: selectedCoin.symbol,
        coinImage: selectedCoin.image,
        type: tradeType,
        amount: numAmount,
        price: selectedCoin.price,
      }),
    );
    setAmount("");
  };

  const handleTradeTypeChange = (nextType: "buy" | "sell") => {
    setTradeType(nextType);
    setAmount("0");

    if (
      nextType === "sell" &&
      !holdings.some((h) => h.coinId === selectedCoinId)
    ) {
      setSelectedCoinId("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Passer un ordre</h3>

      {/* Buy / Sell toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleTradeTypeChange("buy")}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
            tradeType === "buy"
              ? "bg-success text-white"
              : "bg-surface text-muted-foreground hover:bg-surface/80"
          }`}
        >
          Acheter
        </button>
        <button
          type="button"
          onClick={() => handleTradeTypeChange("sell")}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
            tradeType === "sell"
              ? "bg-red-500 text-white"
              : "bg-surface text-muted-foreground hover:bg-surface/80"
          }`}
        >
          Vendre
        </button>
      </div>

      {/* Crypto select */}
      <div>
        <label className="block text-sm text-muted-foreground mb-1">
          Crypto
        </label>
        <select
          value={selectedCoinId}
          onChange={(e) => setSelectedCoinId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring focus:border-primary"
        >
          <option value="">Sélectionner une crypto</option>
          {availableCoins.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.symbol.toUpperCase()}) —{" "}
              {formatPrice(c.price, 2, symbol)}
            </option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm text-muted-foreground mb-1">
          Quantité
        </label>
        <div className=" flex gap-1">
          <input
            type="text"
            step="any"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className=" w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring focus:border-primary"
          />
          <button
            type="button"
            className=" w-[55px] h-[40px] bg-primary py-2.5 rounded-lg font-semibold transition-colors hover:cursor-pointer flex items-center justify-center"
            onClick={() => {
              if (!selectedCoin) return;
              if (tradeType === "buy") {
                setAmount((balance / selectedCoin.price).toString());
              } else if (holding) {
                setAmount(holding.amount.toString());
              }
            }}
          >
            Max
          </button>
        </div>
        {tradeType === "sell" && holding && (
          <p className="text-xs text-muted-foreground mt-1">
            Disponible : {holding.amount.toFixed(6)}{" "}
            {holding.coinSymbol.toUpperCase()}
          </p>
        )}
      </div>

      {/* Total preview */}
      {selectedCoin && numAmount > 0 && (
        <div className="flex items-center justify-between text-sm bg-surface rounded-lg px-3 py-2">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold text-foreground">
            {formatPrice(total, 2, symbol)}
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={!canTrade}
        className={`w-full py-2.5 rounded-lg font-semibold transition-colors hover:cursor-pointer ${
          canTrade
            ? tradeType === "buy"
              ? "bg-success hover:bg-success/90 text-white"
              : "bg-red-500 hover:bg-red-500/90 text-white"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        {tradeType === "buy" ? "Acheter" : "Vendre"}
        {selectedCoin ? ` ${selectedCoin.symbol.toUpperCase()}` : ""}
      </button>
    </form>
  );
}
