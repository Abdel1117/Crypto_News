"use client";

import React, { useId, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { executeTrade } from "@/app/lib/features/simulation/simulationSlice";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { CryptoMarketData } from "@/app/types/Crypto/Crypto";
import { InfoIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import { formatFiatPrice } from "@/app/utils/Format/FrFormat/FrFormat";
import CoinPicker from "./CoinPicker";
import { formatQuantity, signedFiat, trendColor } from "./usePortfolio";

interface TradeFormProps {
  coins: CryptoMarketData[];
  selectedId: string | null | number;
  handleSymbolChange: (value: string) => void;
  /** Rendered inside the mobile bottom sheet (which owns the title). */
  inSheet?: boolean;
  /** Called after an order went through (closes the mobile sheet). */
  onTraded?: () => void;
}

type TradeType = "buy" | "sell";

export default function TradeForm({
  coins,
  selectedId,
  handleSymbolChange,
  inSheet = false,
  onTraded,
}: TradeFormProps) {
  const dispatch = useAppDispatch();
  const { currency } = useCurrency();
  const { balance: balanceEur, holdings } = useAppSelector(
    (state) => state.simulation,
  );
  const usdPerEur = useAppSelector((state) => state.exchangeRate.usdPerEur);
  const rateUnavailable = currency === "usd" && !usdPerEur;
  // Balance and average prices are stored in EUR; prices arrive in the
  // display currency.
  const multiplier = currency === "usd" ? (usdPerEur ?? 1) : 1;
  const balance = balanceEur * multiplier;

  const [tradeType, setTradeType] = useState<TradeType>("buy");
  const [amount, setAmount] = useState("");
  const reasonId = useId();

  const sellableCoins = coins.filter((c) =>
    holdings.some((h) => h.coinId === c.id),
  );
  const availableCoins = tradeType === "sell" ? sellableCoins : coins;

  const selectedCoin = coins.find((c) => c.id === selectedId);
  const holding = holdings.find((h) => h.coinId === selectedId);
  // Accept both "0,5" and "0.5".
  const numAmount = Number.parseFloat(amount.replace(",", ".")) || 0;
  const total = selectedCoin ? numAmount * selectedCoin.price : 0;
  const estimatedPnl =
    tradeType === "sell" && selectedCoin && holding
      ? (selectedCoin.price - holding.avgBuyPrice * multiplier) * numAmount
      : 0;

  const overBalance = tradeType === "buy" && total > balance;
  const overHolding =
    tradeType === "sell" && (!holding || numAmount > holding.amount);

  const canTrade =
    Boolean(selectedCoin) &&
    numAmount > 0 &&
    !rateUnavailable &&
    !overBalance &&
    !overHolding;

  // Why the button is disabled, written out rather than just greyed out.
  let reason: string | null = null;
  if (rateUnavailable) {
    reason = "Taux de change USD indisponible, réessayez plus tard.";
  } else if (tradeType === "buy" && balance < 0.01) {
    reason =
      "Solde insuffisant. Vendez une position ou réinitialisez le portefeuille.";
  } else if (tradeType === "sell" && sellableCoins.length === 0) {
    reason = "Aucune position à vendre pour le moment.";
  } else if (overBalance) {
    reason = "Montant supérieur au solde disponible.";
  } else if (numAmount > 0 && overHolding && holding) {
    reason = "Quantité supérieure à votre position.";
  }

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
        currency,
        usdPerEur,
      }),
    );
    setAmount("");
    onTraded?.();
  };

  const handleTradeTypeChange = (nextType: TradeType) => {
    setTradeType(nextType);
    setAmount("");
    if (nextType === "sell" && !holdings.some((h) => h.coinId === selectedId)) {
      handleSymbolChange("");
    }
  };

  const fillMax = () => {
    if (!selectedCoin) return;
    if (tradeType === "buy") {
      setAmount(String(balance / selectedCoin.price));
    } else if (holding) {
      setAmount(String(holding.amount));
    }
  };

  const money = (v: number) => formatFiatPrice(v, currency);
  const symbol = selectedCoin?.symbol.toUpperCase() ?? "";

  let submitLabel: string;
  if (tradeType === "buy") {
    submitLabel = selectedCoin ? `Acheter du ${selectedCoin.name}` : "Acheter";
  } else if (selectedCoin && numAmount > 0) {
    submitLabel = `Vendre ${formatQuantity(numAmount)} ${symbol}`;
  } else {
    submitLabel = selectedCoin ? `Vendre du ${selectedCoin.name}` : "Vendre";
  }

  let pickerHint: React.ReactNode = null;
  if (selectedCoin) {
    const price = `Prix actuel ${money(selectedCoin.price)}`;
    pickerHint =
      tradeType === "sell" && holding
        ? `Détenu ${formatQuantity(holding.amount)} ${symbol} · ${price}`
        : price;
  }

  type SummaryRow = {
    label: string;
    value: string;
    strong?: boolean;
    color?: string;
  };
  const rows: SummaryRow[] =
    tradeType === "buy"
      ? [
          { label: "Solde disponible", value: money(balance) },
          { label: "Total estimé", value: money(total), strong: true },
        ]
      : [
          { label: "Total estimé", value: money(total), strong: true },
          {
            label: "PnL réalisé",
            value: signedFiat(estimatedPnl, currency),
            color: trendColor(estimatedPnl),
          },
        ];

  return (
    <form
      onSubmit={handleSubmit}
      className={
        inSheet
          ? "flex flex-col gap-4"
          : "n-panel flex flex-col gap-4 p-[18px] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--n-accent)_30%,transparent)]"
      }
      aria-labelledby={inSheet ? undefined : "trade-title"}
      aria-label={inSheet ? "Passer un ordre" : undefined}
    >
      {!inSheet && (
        <h2 id="trade-title" className="m-0 text-base">
          Passer un ordre
        </h2>
      )}

      <div className="n-seg flex!" role="group" aria-label="Sens de l’ordre">
        {(
          [
            ["buy", "Acheter"],
            ["sell", "Vendre"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className="n-seg-btn"
            aria-pressed={tradeType === value}
            onClick={() => handleTradeTypeChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <CoinPicker
        label="Crypto"
        coins={availableCoins}
        value={(selectedId as string) || null}
        onChange={handleSymbolChange}
        currency={currency}
        emptyLabel={
          tradeType === "sell" && sellableCoins.length === 0
            ? "Aucune position à vendre"
            : "Sélectionner une crypto"
        }
        hint={pickerHint}
      />

      <div className="n-field">
        <label htmlFor="tradeFormAmount">Quantité</label>
        <div className="relative">
          <input
            id="tradeFormAmount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="n-text-input n-tnum pr-16!"
            aria-invalid={numAmount > 0 && (overBalance || overHolding)}
            aria-describedby={reason ? reasonId : undefined}
          />
          <button
            type="button"
            className="n-btn absolute right-0.5 top-0.5 lg:right-1 lg:top-1 min-h-11 lg:min-h-[34px] px-3! text-[13px]! text-(--n-accent)! hover:bg-[color-mix(in_srgb,var(--n-accent)_10%,transparent)]"
            onClick={fillMax}
            disabled={!selectedCoin}
          >
            Max
          </button>
        </div>
      </div>

      <dl className="m-0 flex flex-col gap-2 text-sm lg:text-[13px] n-tnum">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-3">
            <dt className="text-(--n-neutral-400)">{r.label}</dt>
            <dd
              className={`m-0 ${r.strong ? "font-medium" : ""}`}
              style={r.color ? { color: r.color } : undefined}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      <button
        type="submit"
        disabled={!canTrade}
        className="n-btn n-btn-primary w-full min-h-12 lg:min-h-[42px] max-lg:text-[15px]!"
      >
        {submitLabel}
      </button>

      {reason && (
        <p
          id={reasonId}
          className="-mt-1 mb-0 flex gap-2 text-xs leading-normal text-(--n-neutral-400)"
          role="status"
        >
          <InfoIcon size={14} className="flex-none mt-0.5" />
          {reason}
        </p>
      )}
    </form>
  );
}
