"use client";

import React, { useId, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { executeTrade, type Holding } from "@/app/lib/features/simulation/simulationSlice";
import { useCurrency, type Currency } from "@/app/context/Curency/CurrencyContext";
import { CryptoMarketData } from "@/app/types/Crypto/Crypto";
import { formatFiatPrice } from "@/app/utils/Format/FrFormat/FrFormat";
import CoinPicker from "./CoinPicker";
import { OrderReason, OrderSummary, SideToggle, type OrderSide, type SummaryRow } from "./OrderParts";
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

type TradeType = OrderSide;

interface TradeInput {
  coins: CryptoMarketData[];
  holdings: Holding[];
  selectedId: string | null | number;
  amountText: string;
  tradeType: TradeType;
  /** Cash, in the display currency. */
  balance: number;
  /** EUR → display currency (average prices are stored in EUR). */
  multiplier: number;
  rateUnavailable: boolean;
}

interface TradeView {
  availableCoins: CryptoMarketData[];
  sellableCount: number;
  selectedCoin: CryptoMarketData | undefined;
  holding: Holding | undefined;
  numAmount: number;
  total: number;
  estimatedPnl: number;
  invalid: boolean;
  canTrade: boolean;
  reason: string | null;
}

interface BlockerInput {
  tradeType: TradeType;
  rateUnavailable: boolean;
  balance: number;
  sellableCount: number;
  overBalance: boolean;
  overHolding: boolean;
  numAmount: number;
  holding: Holding | undefined;
}

/** Why the button is disabled, written out rather than just greyed out. */
function tradeBlocker(b: BlockerInput): string | null {
  if (b.rateUnavailable) return "Taux de change USD indisponible, réessayez plus tard.";
  if (b.tradeType === "buy" && b.balance < 0.01) {
    return "Solde insuffisant. Vendez une position ou réinitialisez le portefeuille.";
  }
  if (b.tradeType === "sell" && b.sellableCount === 0) return "Aucune position à vendre pour le moment.";
  if (b.overBalance) return "Montant supérieur au solde disponible.";
  if (b.numAmount > 0 && b.overHolding && b.holding) return "Quantité supérieure à votre position.";
  return null;
}

function estimatePnl(
  tradeType: TradeType,
  coin: CryptoMarketData | undefined,
  holding: Holding | undefined,
  multiplier: number,
  numAmount: number,
): number {
  if (tradeType !== "sell" || !coin || !holding) return 0;
  return (coin.price - holding.avgBuyPrice * multiplier) * numAmount;
}

/** Everything the form shows, derived from the inputs. */
function deriveTrade(t: TradeInput): TradeView {
  const sellableCoins = t.coins.filter((c) => t.holdings.some((h) => h.coinId === c.id));
  const selectedCoin = t.coins.find((c) => c.id === t.selectedId);
  const holding = t.holdings.find((h) => h.coinId === t.selectedId);
  // Accept both "0,5" and "0.5".
  const numAmount = Number.parseFloat(t.amountText.replace(",", ".")) || 0;
  const total = selectedCoin ? numAmount * selectedCoin.price : 0;

  const isSell = t.tradeType === "sell";
  const overBalance = !isSell && total > t.balance;
  const overHolding = isSell && (!holding || numAmount > holding.amount);

  return {
    availableCoins: isSell ? sellableCoins : t.coins,
    sellableCount: sellableCoins.length,
    selectedCoin,
    holding,
    numAmount,
    total,
    estimatedPnl: estimatePnl(t.tradeType, selectedCoin, holding, t.multiplier, numAmount),
    invalid: numAmount > 0 && (overBalance || overHolding),
    canTrade: Boolean(selectedCoin) && numAmount > 0 && !t.rateUnavailable && !overBalance && !overHolding,
    reason: tradeBlocker({
      tradeType: t.tradeType,
      rateUnavailable: t.rateUnavailable,
      balance: t.balance,
      sellableCount: sellableCoins.length,
      overBalance,
      overHolding,
      numAmount,
      holding,
    }),
  };
}

function submitLabel(tradeType: TradeType, coin: CryptoMarketData | undefined, numAmount: number): string {
  if (tradeType === "sell" && coin && numAmount > 0) {
    return `Vendre ${formatQuantity(numAmount)} ${coin.symbol.toUpperCase()}`;
  }
  const verb = tradeType === "buy" ? "Acheter" : "Vendre";
  return coin ? `${verb} du ${coin.name}` : verb;
}

function pickerHint(
  tradeType: TradeType,
  coin: CryptoMarketData | undefined,
  holding: Holding | undefined,
  currency: Currency,
): string | null {
  if (!coin) return null;
  const price = `Prix actuel ${formatFiatPrice(coin.price, currency)}`;
  if (tradeType === "sell" && holding) {
    return `Détenu ${formatQuantity(holding.amount)} ${coin.symbol.toUpperCase()} · ${price}`;
  }
  return price;
}

function summaryRows(tradeType: TradeType, view: TradeView, balance: number, currency: Currency): SummaryRow[] {
  const money = (v: number) => formatFiatPrice(v, currency);
  if (tradeType === "buy") {
    return [
      { label: "Solde disponible", value: money(balance) },
      { label: "Total estimé", value: money(view.total), strong: true },
    ];
  }
  return [
    { label: "Total estimé", value: money(view.total), strong: true },
    {
      label: "PnL réalisé",
      value: signedFiat(view.estimatedPnl, currency),
      color: trendColor(view.estimatedPnl),
    },
  ];
}

function maxAmount(
  tradeType: TradeType,
  coin: CryptoMarketData | undefined,
  holding: Holding | undefined,
  balance: number,
): string | null {
  if (!coin) return null;
  if (tradeType === "buy") return String(balance / coin.price);
  return holding ? String(holding.amount) : null;
}

/** Switching to "sell" drops a selected coin that isn't held. */
const dropsSelection = (next: TradeType, holdings: Holding[], selectedId: TradeFormProps["selectedId"]) =>
  next === "sell" && !holdings.some((h) => h.coinId === selectedId);

const emptyLabel = (tradeType: TradeType, sellableCount: number) =>
  tradeType === "sell" && sellableCount === 0 ? "Aucune position à vendre" : "Sélectionner une crypto";

const PANEL_FRAME = {
  className:
    "n-panel flex flex-col gap-4 p-[18px] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--n-accent)_30%,transparent)]",
  "aria-labelledby": "trade-title",
};
const SHEET_FRAME = { className: "flex flex-col gap-4", "aria-label": "Passer un ordre" };

function FormTitle({ hidden }: Readonly<{ hidden: boolean }>) {
  if (hidden) return null;
  return (
    <h2 id="trade-title" className="m-0 text-base">
      Passer un ordre
    </h2>
  );
}

export default function TradeForm({
  coins,
  selectedId,
  handleSymbolChange,
  inSheet = false,
  onTraded,
}: Readonly<TradeFormProps>) {
  const dispatch = useAppDispatch();
  const { currency } = useCurrency();
  const { balance: balanceEur, holdings } = useAppSelector(
    (state) => state.simulation,
  );
  const usdPerEur = useAppSelector((state) => state.exchangeRate.usdPerEur);
  const isUsd = currency === "usd";
  const rateUnavailable = isUsd && !usdPerEur;
  // Balance and average prices are stored in EUR; prices arrive in the
  // display currency.
  const multiplier = isUsd ? (usdPerEur ?? 1) : 1;
  const balance = balanceEur * multiplier;

  const [tradeType, setTradeType] = useState<TradeType>("buy");
  const [amount, setAmount] = useState("");
  const reasonId = useId();

  const view = deriveTrade({
    coins,
    holdings,
    selectedId,
    amountText: amount,
    tradeType,
    balance,
    multiplier,
    rateUnavailable,
  });
  const { selectedCoin, holding, numAmount, reason } = view;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoin || !view.canTrade) return;
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
    if (dropsSelection(nextType, holdings, selectedId)) handleSymbolChange("");
  };

  const fillMax = () => {
    const max = maxAmount(tradeType, selectedCoin, holding, balance);
    if (max !== null) setAmount(max);
  };

  return (
    <form onSubmit={handleSubmit} {...(inSheet ? SHEET_FRAME : PANEL_FRAME)}>
      <FormTitle hidden={inSheet} />

      <SideToggle side={tradeType} onChange={handleTradeTypeChange} />

      <CoinPicker
        label="Crypto"
        coins={view.availableCoins}
        value={selectedId ? String(selectedId) : null}
        onChange={handleSymbolChange}
        currency={currency}
        emptyLabel={emptyLabel(tradeType, view.sellableCount)}
        hint={pickerHint(tradeType, selectedCoin, holding, currency)}
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
            aria-invalid={view.invalid}
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

      <OrderSummary rows={summaryRows(tradeType, view, balance, currency)} />

      <button
        type="submit"
        disabled={!view.canTrade}
        className="n-btn n-btn-primary w-full min-h-12 lg:min-h-[42px] max-lg:text-[15px]!"
      >
        {submitLabel(tradeType, selectedCoin, numAmount)}
      </button>

      <OrderReason id={reasonId} reason={reason} />
    </form>
  );
}
