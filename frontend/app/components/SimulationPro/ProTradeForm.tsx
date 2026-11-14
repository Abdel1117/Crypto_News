"use client";

import React, { useEffect, useId, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { fetchMarketCoin, searchSymbols } from "@/app/lib/api/crypto";
import type {
  PortfolioCurrency,
  ProPortfolio,
  ProPosition,
  TradeOrder,
} from "@/app/lib/api/simulationPro";
import { placeTrade } from "@/app/lib/features/simulationPro/simulationProThunks";
import { clearTradeError } from "@/app/lib/features/simulationPro/simulationProSlice";
import CoinAvatar from "@/app/ui/CoinAvatar/CoinAvatar";
import { formatFiatPrice } from "@/app/utils/Format/FrFormat/FrFormat";
import { CURRENCY_SYMBOLS } from "@/app/utils/constants/currency";
import { formatQuantity, signedFiat, trendColor } from "@/app/components/Simulation/usePortfolio";
import {
  OrderReason,
  OrderSummary,
  SideToggle,
  type OrderSide,
  type SummaryRow,
} from "@/app/components/Simulation/OrderParts";
import { parseDecimalInput, toApiDecimal } from "./format";

export interface CoinChoice {
  id: string;
  symbol: string;
  name: string;
  image: string;
}

interface ProTradeFormProps {
  portfolio: ProPortfolio;
  selected: CoinChoice | null;
  onSelect: (coin: CoinChoice | null) => void;
  /** Rendered inside the mobile bottom sheet (which owns the title). */
  inSheet?: boolean;
  /** Called after an order went through (closes the mobile sheet). */
  onTraded?: () => void;
}

type Side = OrderSide;
type SearchState = "idle" | "loading" | "error";

const MIN_ORDER = 1;
const SEARCH_DELAY_MS = 300;

// ---------- pure helpers ----------

/** Estimates shown to the cent: 0.99999… of float math must read "1,00 €". */
const toCents = (v: number) => Math.round(v * 100) / 100;

const findPosition = (positions: ProPosition[], coin: CoinChoice | null) =>
  coin ? positions.find((p) => p.coin_id === coin.id) : undefined;

/** Switching to "sell" drops a selected coin that isn't held. */
const dropsSelection = (next: Side, positions: ProPosition[], coin: CoinChoice | null) =>
  next === "sell" && coin !== null && !positions.some((p) => p.coin_id === coin.id);

/** The typed amount, or 0 when the field is empty or isn't a positive number. */
function parseAmount(text: string): number {
  const value = parseDecimalInput(text);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function searchStatus(searchable: boolean, answered: boolean, coins: CoinChoice[] | null): SearchState {
  if (!searchable) return "idle";
  if (!answered) return "loading";
  return coins === null ? "error" : "idle";
}

interface Estimates {
  buyGross: number;
  buyFee: number;
  buyQuantity: number;
  sellFee: number;
  sellNet: number;
  sellPnl: number;
}

const NO_ESTIMATE: Estimates = {
  buyGross: 0,
  buyFee: 0,
  buyQuantity: 0,
  sellFee: 0,
  sellNet: 0,
  sellPnl: 0,
};

/** Buy: `amount` is the money spent, fee included. Sell: a quantity. */
function estimateOrder(
  side: Side,
  amount: number,
  price: number | null,
  feeRate: number,
  position: ProPosition | undefined,
): Estimates {
  if (amount <= 0) return NO_ESTIMATE;
  if (side === "buy") {
    const buyGross = amount / (1 + feeRate);
    return {
      ...NO_ESTIMATE,
      buyGross,
      buyFee: amount - buyGross,
      buyQuantity: price ? buyGross / price : 0,
    };
  }
  const sellGross = price ? amount * price : 0;
  const sellFee = sellGross * feeRate;
  const sellNet = sellGross - sellFee;
  const sellPnl = position ? sellNet - position.avg_cost * amount : 0;
  return { ...NO_ESTIMATE, sellFee, sellNet, sellPnl };
}

interface BlockerInput {
  side: Side;
  hasSelection: boolean;
  hasPositions: boolean;
  price: number | null;
  priceFailed: boolean;
  amountText: string;
  amount: number;
  cash: number;
  buyGross: number;
  heldQuantity: number | undefined;
  currency: PortfolioCurrency;
}

function pickPrompt(side: Side, hasPositions: boolean): string {
  if (side === "buy") return "Cherche et choisis une crypto.";
  return hasPositions ? "Choisis une position à vendre." : "Aucune position à vendre pour le moment.";
}

/** Why a valid amount is still more, or less, than this order allows. */
function amountLimitBlocker(o: BlockerInput): string | null {
  if (o.side === "buy") {
    if (o.amount > o.cash) return "Montant supérieur à tes liquidités.";
    if (o.buyGross < MIN_ORDER) return `Montant trop petit : minimum ${formatFiatPrice(MIN_ORDER, o.currency)}.`;
    return null;
  }
  if (o.heldQuantity !== undefined && o.amount > o.heldQuantity) return "Quantité supérieure à ta position.";
  return null;
}

/** Why the order can't be sent yet, or null when nothing stands in the way. */
function orderBlocker(o: BlockerInput): string | null {
  if (!o.hasSelection) return pickPrompt(o.side, o.hasPositions);
  if (o.price === null) {
    return o.priceFailed ? "Prix indisponible pour cette crypto, réessaie plus tard." : "Chargement du prix…";
  }
  if (o.amount <= 0) {
    if (!o.amountText) return null;
    return o.side === "buy" ? "Montant invalide." : "Quantité invalide.";
  }
  return amountLimitBlocker(o);
}

function maxAmountText(side: Side, cash: number, position: ProPosition | undefined): string | null {
  if (side === "buy") return toApiDecimal(cash, 2).replace(".", ",");
  return position ? toApiDecimal(position.quantity, 12).replace(".", ",") : null;
}

function buildOrder(side: Side, coinId: string, amount: number, position: ProPosition | undefined): TradeOrder {
  if (side === "buy") return { coin_id: coinId, side, amount: toApiDecimal(amount, 8) };
  // Selling "everything" sends the exact held quantity.
  const sellsAll = position !== undefined && Math.abs(amount - position.quantity) < 1e-12;
  return { coin_id: coinId, side, quantity: toApiDecimal(sellsAll ? position.quantity : amount, 12) };
}

function submitLabel(trading: boolean, side: Side, coin: CoinChoice | null): string {
  if (trading) return "Envoi de l’ordre…";
  const verb = side === "buy" ? "Acheter" : "Vendre";
  return coin ? `${verb} du ${coin.name}` : verb;
}

function summaryRows(
  side: Side,
  est: Estimates,
  { cash, feeRate, currency, symbol }: { cash: number; feeRate: number; currency: PortfolioCurrency; symbol: string },
): SummaryRow[] {
  const feeLabel = `Frais (${(feeRate * 100).toLocaleString("fr-FR")} %)`;
  const cents = (v: number) => formatFiatPrice(toCents(v), currency);
  if (side === "buy") {
    return [
      { label: "Liquidités", value: formatFiatPrice(cash, currency) },
      { label: feeLabel, value: cents(est.buyFee) },
      {
        label: "Quantité estimée",
        value: est.buyQuantity ? `${formatQuantity(est.buyQuantity)} ${symbol}` : "—",
        strong: true,
      },
    ];
  }
  return [
    { label: feeLabel, value: cents(est.sellFee) },
    { label: "Montant net estimé", value: cents(est.sellNet), strong: true },
    {
      label: "PnL estimé",
      value: signedFiat(toCents(est.sellPnl), currency),
      color: trendColor(est.sellPnl),
    },
  ];
}

// ---------- hooks ----------

/**
 * Coin search (buys), debounced. Answers are stored with the query they
 * answer, so loading and error states are derived instead of being set
 * inside effects.
 */
export function useCoinSearch(query: string, enabled: boolean): { results: CoinChoice[]; state: SearchState } {
  const trimmed = query.trim();
  const searchable = enabled && trimmed.length >= 2;
  const [answer, setAnswer] = useState<{ query: string; coins: CoinChoice[] | null }>({
    query: "",
    coins: [],
  });

  useEffect(() => {
    if (!searchable) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      searchSymbols(trimmed)
        .then((coins: CoinChoice[]) => {
          if (!cancelled) {
            setAnswer({ query: trimmed, coins: Array.isArray(coins) ? coins.slice(0, 8) : [] });
          }
        })
        .catch(() => {
          if (!cancelled) setAnswer({ query: trimmed, coins: null });
        });
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchable, trimmed]);

  const answered = searchable && answer.query === trimmed;
  return {
    results: answered && answer.coins ? answer.coins : [],
    state: searchStatus(searchable, answered, answer.coins),
  };
}

/** Live price of the selected coin (the server re-prices the order anyway). */
export function useQuote(currency: PortfolioCurrency, coin: CoinChoice | null): { price: number | null; failed: boolean } {
  const [quote, setQuote] = useState<{ key: string; price: number | null } | null>(null);
  const key = coin ? `${currency}:${coin.id}` : null;

  useEffect(() => {
    if (!coin || !key) return;
    let cancelled = false;
    fetchMarketCoin(currency, coin.id)
      .then((data: { price?: number }) => {
        if (cancelled) return;
        const valid = typeof data?.price === "number" && data.price > 0;
        setQuote({ key, price: valid ? (data.price as number) : null });
      })
      .catch(() => {
        if (!cancelled) setQuote({ key, price: null });
      });
    return () => {
      cancelled = true;
    };
  }, [coin, currency, key]);

  const current = quote?.key === key ? quote : null;
  return { price: current?.price ?? null, failed: current !== null && current.price === null };
}

// ---------- pieces of the form ----------

function SearchResults({
  coins,
  onChoose,
}: Readonly<{ coins: CoinChoice[]; onChoose: (coin: CoinChoice) => void }>) {
  return (
    <ul className="m-0 mt-1 p-1 list-none flex flex-col rounded-(--n-radius-md) border border-(--n-divider) bg-(--n-surface)" aria-label="Résultats de recherche">
      {coins.map((coin) => (
        <li key={coin.id}>
          <button
            type="button"
            className="n-row-btn flex items-center gap-2.5 w-full min-h-11 px-2 border-0 bg-transparent text-left font-[inherit] text-(--n-text) cursor-pointer rounded-md"
            onClick={() => onChoose(coin)}
          >
            <CoinAvatar image={coin.image} name={coin.name} symbol={coin.symbol} size={22} />
            <span className="truncate">{coin.name}</span>
            <span className="text-xs text-(--n-neutral-500)">{coin.symbol.toUpperCase()}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

interface CoinSearchFieldProps {
  inputId: string;
  reasonId: string;
  selected: CoinChoice | null;
  query: string;
  onQueryChange: (query: string) => void;
  search: { results: CoinChoice[]; state: SearchState };
  onChoose: (coin: CoinChoice | null) => void;
}

export function CoinSearchField({
  inputId,
  reasonId,
  selected,
  query,
  onQueryChange,
  search,
  onChoose,
}: Readonly<CoinSearchFieldProps>) {
  return (
    <div className="n-field relative">
      <label htmlFor={inputId}>Crypto</label>
      {selected ? (
        <div className="flex items-center gap-2.5 min-h-10.5 px-2.5 rounded-(--n-radius-md) border border-(--n-divider)">
          <CoinAvatar image={selected.image} name={selected.name} symbol={selected.symbol} size={24} />
          <span className="font-medium truncate">{selected.name}</span>
          <span className="text-[13px] text-(--n-neutral-500)">{selected.symbol.toUpperCase()}</span>
          <button
            type="button"
            className="n-btn ml-auto text-[13px]! text-(--n-accent)!"
            onClick={() => onChoose(null)}
          >
            Changer
          </button>
        </div>
      ) : (
        <>
          <input
            id={inputId}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Bitcoin, ETH, Solana…"
            className="n-text-input"
            aria-describedby={reasonId}
          />
          {search.state === "loading" && (
            <output className="block m-0 mt-1 text-xs text-(--n-neutral-500)">Recherche…</output>
          )}
          {search.state === "error" && (
            <output className="block m-0 mt-1 text-xs text-(--n-down)">Recherche indisponible, réessaie.</output>
          )}
          {search.results.length > 0 && <SearchResults coins={search.results} onChoose={onChoose} />}
        </>
      )}
    </div>
  );
}

function PositionSelect({
  id,
  positions,
  selectedId,
  onChoose,
}: Readonly<{
  id: string;
  positions: ProPosition[];
  selectedId: string;
  onChoose: (coin: CoinChoice | null) => void;
}>) {
  return (
    <div className="n-field">
      <label htmlFor={id}>Position</label>
      <select
        id={id}
        className="n-text-input"
        value={selectedId}
        disabled={positions.length === 0}
        onChange={(e) => {
          const p = positions.find((x) => x.coin_id === e.target.value);
          onChoose(p ? { id: p.coin_id, symbol: p.symbol, name: p.name, image: p.image } : null);
        }}
      >
        <option value="">{positions.length ? "Choisir une position" : "Aucune position"}</option>
        {positions.map((p) => (
          <option key={p.coin_id} value={p.coin_id}>
            {p.name} · {formatQuantity(p.quantity)} {p.symbol.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}

function PriceLine({
  price,
  currency,
  side,
  position,
  symbol,
}: Readonly<{
  price: number | null;
  currency: PortfolioCurrency;
  side: Side;
  position: ProPosition | undefined;
  symbol: string;
}>) {
  if (price === null) return null;
  return (
    <p className="-mt-2 mb-0 text-xs text-(--n-neutral-400)">
      Prix actuel {formatFiatPrice(price, currency)}
      {side === "sell" && position && ` · détenu ${formatQuantity(position.quantity)} ${symbol}`}
    </p>
  );
}

interface AmountFieldProps {
  id: string;
  side: Side;
  currency: PortfolioCurrency;
  value: string;
  onChange: (value: string) => void;
  onMax: () => void;
  canMax: boolean;
  /** The current blocker, if any, and the id of the element showing it. */
  reason: string | null;
  reasonId: string;
  hasSelection: boolean;
}

function AmountField({
  id,
  side,
  currency,
  value,
  onChange,
  onMax,
  canMax,
  reason,
  reasonId,
  hasSelection,
}: Readonly<AmountFieldProps>) {
  return (
    <div className="n-field">
      <label htmlFor={id}>
        {side === "buy" ? `Montant à investir (${CURRENCY_SYMBOLS[currency]}, frais inclus)` : "Quantité à vendre"}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0,00"
          className="n-text-input n-tnum pr-16!"
          aria-invalid={Boolean(value) && reason !== null && hasSelection}
          aria-describedby={reason ? reasonId : undefined}
        />
        <button
          type="button"
          className="n-btn absolute right-0.5 top-0.5 lg:right-1 lg:top-1 min-h-11 lg:min-h-8.5 px-3! text-[13px]! text-(--n-accent)! hover:bg-[color-mix(in_srgb,var(--n-accent)_10%,transparent)]"
          onClick={onMax}
          disabled={!canMax}
        >
          Max
        </button>
      </div>
    </div>
  );
}

/** The server's refusal if there is one, otherwise what blocks the order. */
function OrderMessages({
  tradeError,
  reason,
  reasonId,
}: Readonly<{ tradeError: string | null; reason: string | null; reasonId: string }>) {
  if (tradeError) {
    return (
      <p className="-mt-1 mb-0 text-sm text-(--n-down)" role="alert">
        {tradeError}
      </p>
    );
  }
  return <OrderReason id={reasonId} reason={reason} />;
}

const PANEL_FRAME = {
  className:
    "n-panel flex flex-col gap-4 p-4.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--n-accent)_30%,transparent)]",
  "aria-labelledby": "pro-trade-title",
};
const SHEET_FRAME = { className: "flex flex-col gap-4", "aria-label": "Passer un ordre" };

function FormTitle({ hidden }: Readonly<{ hidden: boolean }>) {
  if (hidden) return null;
  return (
    <h2 id="pro-trade-title" className="m-0 text-base">
      Passer un ordre
    </h2>
  );
}

// ---------- the form ----------

export default function ProTradeForm({
  portfolio,
  selected,
  onSelect,
  inSheet = false,
  onTraded,
}: Readonly<ProTradeFormProps>) {
  const dispatch = useAppDispatch();
  const { trading, tradeError } = useAppSelector((state) => state.simulationPro);
  const ids = { search: useId(), amount: useId(), reason: useId(), position: useId() };
  const { currency, cash, positions, fee_rate: feeRate } = portfolio;

  const [side, setSide] = useState<Side>("buy");
  const [query, setQuery] = useState("");
  const [amountText, setAmountText] = useState("");

  const position = findPosition(positions, selected);
  const symbol = selected?.symbol.toUpperCase() ?? "";
  const search = useCoinSearch(query, side === "buy");
  const quote = useQuote(currency, selected);
  const price = quote.price ?? position?.price ?? null;

  const amount = parseAmount(amountText);
  const estimates = estimateOrder(side, amount, price, feeRate, position);
  const reason = orderBlocker({
    side,
    hasSelection: selected !== null,
    hasPositions: positions.length > 0,
    price,
    priceFailed: quote.failed,
    amountText,
    amount,
    cash,
    buyGross: estimates.buyGross,
    heldQuantity: position?.quantity,
    currency,
  });
  const canSubmit = selected !== null && price !== null && amount > 0 && reason === null && !trading;

  const resetInputs = () => {
    setQuery("");
    setAmountText("");
    dispatch(clearTradeError());
  };

  const changeSide = (next: Side) => {
    setSide(next);
    resetInputs();
    if (dropsSelection(next, positions, selected)) onSelect(null);
  };

  const choose = (coin: CoinChoice | null) => {
    onSelect(coin);
    resetInputs();
  };

  const fillMax = () => {
    const max = maxAmountText(side, cash, position);
    if (max !== null) setAmountText(max);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selected) return;
    dispatch(placeTrade(buildOrder(side, selected.id, amount, position)))
      .unwrap()
      .then(() => {
        setAmountText("");
        onTraded?.();
      })
      .catch(() => {
        // The message is in state.tradeError, shown below.
      });
  };

  return (
    <form onSubmit={submit} {...(inSheet ? SHEET_FRAME : PANEL_FRAME)}>
      <FormTitle hidden={inSheet} />

      <SideToggle side={side} onChange={changeSide} />

      {side === "buy" ? (
        <CoinSearchField
          inputId={ids.search}
          reasonId={ids.reason}
          selected={selected}
          query={query}
          onQueryChange={setQuery}
          search={search}
          onChoose={choose}
        />
      ) : (
        <PositionSelect id={ids.position} positions={positions} selectedId={selected?.id ?? ""} onChoose={choose} />
      )}

      <PriceLine price={price} currency={currency} side={side} position={position} symbol={symbol} />

      <AmountField
        id={ids.amount}
        side={side}
        currency={currency}
        value={amountText}
        onChange={setAmountText}
        onMax={fillMax}
        canMax={side === "buy" || position !== undefined}
        reason={reason}
        reasonId={ids.reason}
        hasSelection={selected !== null}
      />

      <OrderSummary
        rows={summaryRows(side, estimates, { cash, feeRate, currency, symbol })}
      />

      <button
        type="submit"
        disabled={!canSubmit}
        className="n-btn n-btn-primary w-full min-h-12 lg:min-h-10.5 max-lg:text-[15px]!"
      >
        {submitLabel(trading, side, selected)}
      </button>

      <OrderMessages tradeError={tradeError} reason={reason} reasonId={ids.reason} />
      <p className="m-0 text-[11px] leading-snug text-(--n-neutral-500)">
        L&apos;ordre est exécuté au prix du marché au moment de l&apos;envoi, qui peut légèrement différer du prix affiché.
      </p>
    </form>
  );
}
