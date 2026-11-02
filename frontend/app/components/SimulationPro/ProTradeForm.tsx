"use client";

import React, { useEffect, useId, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { fetchMarketCoin, searchSymbols } from "@/app/lib/api/crypto";
import type { ProPortfolio } from "@/app/lib/api/simulationPro";
import { placeTrade } from "@/app/lib/features/simulationPro/simulationProThunks";
import { clearTradeError } from "@/app/lib/features/simulationPro/simulationProSlice";
import CoinAvatar from "@/app/ui/CoinAvatar/CoinAvatar";
import { InfoIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import { formatFiatPrice } from "@/app/utils/Format/FrFormat/FrFormat";
import { CURRENCY_SYMBOLS } from "@/app/utils/constants/currency";
import { formatQuantity, signedFiat, trendColor } from "@/app/components/Simulation/usePortfolio";
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

type Side = "buy" | "sell";

const MIN_ORDER = 1;
const SEARCH_DELAY_MS = 300;

export default function ProTradeForm({
  portfolio,
  selected,
  onSelect,
  inSheet = false,
  onTraded,
}: ProTradeFormProps) {
  const dispatch = useAppDispatch();
  const { trading, tradeError } = useAppSelector((state) => state.simulationPro);
  const ids = { search: useId(), amount: useId(), reason: useId(), position: useId() };
  const { currency, cash, positions, fee_rate: feeRate } = portfolio;
  const money = (v: number) => formatFiatPrice(v, currency);
  // Estimates shown to the cent: 0.99999… of float math must read "1,00 €".
  const cents = (v: number) => money(Math.round(v * 100) / 100);

  const [side, setSide] = useState<Side>("buy");
  const [query, setQuery] = useState("");
  const [amountText, setAmountText] = useState("");
  // Answers are stored with what they answer (query, coin), so loading and
  // error states are derived instead of being set inside effects.
  const [search, setSearch] = useState<{ query: string; coins: CoinChoice[] | null }>({
    query: "",
    coins: [],
  });
  const [quote, setQuote] = useState<{ key: string; price: number | null } | null>(null);

  const position = selected ? positions.find((p) => p.coin_id === selected.id) : undefined;

  // Coin search (buys), debounced.
  const trimmed = query.trim();
  const searchable = side === "buy" && trimmed.length >= 2;
  useEffect(() => {
    if (!searchable) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      searchSymbols(trimmed)
        .then((coins: CoinChoice[]) => {
          if (!cancelled) {
            setSearch({ query: trimmed, coins: Array.isArray(coins) ? coins.slice(0, 8) : [] });
          }
        })
        .catch(() => {
          if (!cancelled) setSearch({ query: trimmed, coins: null });
        });
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchable, trimmed]);
  const searchAnswered = searchable && search.query === trimmed;
  const results = searchAnswered && search.coins ? search.coins : [];
  const searchState = !searchable
    ? "idle"
    : !searchAnswered
      ? "loading"
      : search.coins === null
        ? "error"
        : "idle";

  // Live price of the selected coin (the server re-prices the order anyway).
  const quoteKey = selected ? `${currency}:${selected.id}` : null;
  useEffect(() => {
    if (!selected || !quoteKey) return;
    let cancelled = false;
    fetchMarketCoin(currency, selected.id)
      .then((coin: { price?: number }) => {
        if (cancelled) return;
        const valid = typeof coin?.price === "number" && coin.price > 0;
        setQuote({ key: quoteKey, price: valid ? (coin.price as number) : null });
      })
      .catch(() => {
        if (!cancelled) setQuote({ key: quoteKey, price: null });
      });
    return () => {
      cancelled = true;
    };
  }, [selected, currency, quoteKey]);
  const currentQuote = quote && quote.key === quoteKey ? quote : null;
  const priceError = currentQuote !== null && currentQuote.price === null;
  const price = currentQuote?.price ?? position?.price ?? null;

  const value = parseDecimalInput(amountText);
  const hasValue = Number.isFinite(value) && value > 0;

  // Buy: the amount includes the fee. Sell: a quantity.
  const buyGross = side === "buy" && hasValue ? value / (1 + feeRate) : 0;
  const buyFee = side === "buy" && hasValue ? value - buyGross : 0;
  const buyQuantity = side === "buy" && hasValue && price ? buyGross / price : 0;
  const sellGross = side === "sell" && hasValue && price ? value * price : 0;
  const sellFee = sellGross * feeRate;
  const sellNet = sellGross - sellFee;
  const sellPnl = side === "sell" && hasValue && position ? sellNet - position.avg_cost * value : 0;

  let reason: string | null = null;
  if (!selected) {
    reason = side === "buy" ? "Cherche et choisis une crypto." : positions.length ? "Choisis une position à vendre." : "Aucune position à vendre pour le moment.";
  } else if (price === null) {
    reason = priceError ? "Prix indisponible pour cette crypto, réessaie plus tard." : "Chargement du prix…";
  } else if (amountText && !hasValue) {
    reason = side === "buy" ? "Montant invalide." : "Quantité invalide.";
  } else if (side === "buy" && hasValue && value > cash) {
    reason = "Montant supérieur à tes liquidités.";
  } else if (side === "buy" && hasValue && buyGross < MIN_ORDER) {
    reason = `Montant trop petit : minimum ${money(MIN_ORDER)}.`;
  } else if (side === "sell" && hasValue && position && value > position.quantity) {
    reason = "Quantité supérieure à ta position.";
  }
  const canSubmit = Boolean(selected) && price !== null && hasValue && reason === null && !trading;

  const changeSide = (next: Side) => {
    setSide(next);
    setAmountText("");
    setQuery("");
    dispatch(clearTradeError());
    if (next === "sell" && selected && !positions.some((p) => p.coin_id === selected.id)) {
      onSelect(null);
    }
  };

  const choose = (coin: CoinChoice | null) => {
    onSelect(coin);
    setQuery("");
    setAmountText("");
    dispatch(clearTradeError());
  };

  const fillMax = () => {
    if (side === "buy") {
      setAmountText(toApiDecimal(cash, 2).replace(".", ","));
    } else if (position) {
      setAmountText(toApiDecimal(position.quantity, 12).replace(".", ","));
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selected) return;
    const order =
      side === "buy"
        ? { coin_id: selected.id, side, amount: toApiDecimal(value, 8) }
        : {
            coin_id: selected.id,
            side,
            // Selling "everything" sends the exact held quantity.
            quantity:
              position && Math.abs(value - position.quantity) < 1e-12
                ? toApiDecimal(position.quantity, 12)
                : toApiDecimal(value, 12),
          };
    dispatch(placeTrade(order))
      .unwrap()
      .then(() => {
        setAmountText("");
        onTraded?.();
      })
      .catch(() => {
        // The message is in state.tradeError, shown below.
      });
  };

  const symbol = selected?.symbol.toUpperCase() ?? "";
  const rows: { label: string; value: string; strong?: boolean; color?: string }[] =
    side === "buy"
      ? [
          { label: "Liquidités", value: money(cash) },
          { label: `Frais (${(feeRate * 100).toLocaleString("fr-FR")} %)`, value: cents(buyFee) },
          {
            label: "Quantité estimée",
            value: buyQuantity ? `${formatQuantity(buyQuantity)} ${symbol}` : "—",
            strong: true,
          },
        ]
      : [
          { label: `Frais (${(feeRate * 100).toLocaleString("fr-FR")} %)`, value: cents(sellFee) },
          { label: "Montant net estimé", value: cents(sellNet), strong: true },
          {
            label: "PnL estimé",
            value: signedFiat(Math.round(sellPnl * 100) / 100, currency),
            color: trendColor(sellPnl),
          },
        ];

  return (
    <form
      onSubmit={submit}
      className={
        inSheet
          ? "flex flex-col gap-4"
          : "n-panel flex flex-col gap-4 p-4.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--n-accent)_30%,transparent)]"
      }
      aria-labelledby={inSheet ? undefined : "pro-trade-title"}
      aria-label={inSheet ? "Passer un ordre" : undefined}
    >
      {!inSheet && (
        <h2 id="pro-trade-title" className="m-0 text-base">
          Passer un ordre
        </h2>
      )}

      <div className="n-seg flex!" role="group" aria-label="Sens de l’ordre">
        {(
          [
            ["buy", "Acheter"],
            ["sell", "Vendre"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            className="n-seg-btn"
            aria-pressed={side === v}
            onClick={() => changeSide(v)}
          >
            {label}
          </button>
        ))}
      </div>

      {side === "buy" ? (
        <div className="n-field relative">
          <label htmlFor={ids.search}>Crypto</label>
          {selected ? (
            <div className="flex items-center gap-2.5 min-h-10.5 px-2.5 rounded-(--n-radius-md) border border-(--n-divider)">
              <CoinAvatar image={selected.image} name={selected.name} symbol={selected.symbol} size={24} />
              <span className="font-medium truncate">{selected.name}</span>
              <span className="text-[13px] text-(--n-neutral-500)">{symbol}</span>
              <button
                type="button"
                className="n-btn ml-auto text-[13px]! text-(--n-accent)!"
                onClick={() => choose(null)}
              >
                Changer
              </button>
            </div>
          ) : (
            <>
              <input
                id={ids.search}
                type="search"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Bitcoin, ETH, Solana…"
                className="n-text-input"
                aria-describedby={ids.reason}
              />
              {searchState === "loading" && (
                <p className="m-0 mt-1 text-xs text-(--n-neutral-500)" role="status">
                  Recherche…
                </p>
              )}
              {searchState === "error" && (
                <p className="m-0 mt-1 text-xs text-(--n-down)" role="status">
                  Recherche indisponible, réessaie.
                </p>
              )}
              {results.length > 0 && (
                <ul className="m-0 mt-1 p-1 list-none flex flex-col rounded-(--n-radius-md) border border-(--n-divider) bg-(--n-surface)" aria-label="Résultats de recherche">
                  {results.map((coin) => (
                    <li key={coin.id}>
                      <button
                        type="button"
                        className="n-row-btn flex items-center gap-2.5 w-full min-h-11 px-2 border-0 bg-transparent text-left font-[inherit] text-(--n-text) cursor-pointer rounded-md"
                        onClick={() => choose(coin)}
                      >
                        <CoinAvatar image={coin.image} name={coin.name} symbol={coin.symbol} size={22} />
                        <span className="truncate">{coin.name}</span>
                        <span className="text-xs text-(--n-neutral-500)">{coin.symbol.toUpperCase()}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="n-field">
          <label htmlFor={ids.position}>Position</label>
          <select
            id={ids.position}
            className="n-text-input"
            value={selected?.id ?? ""}
            disabled={positions.length === 0}
            onChange={(e) => {
              const p = positions.find((x) => x.coin_id === e.target.value);
              choose(p ? { id: p.coin_id, symbol: p.symbol, name: p.name, image: p.image } : null);
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
      )}

      {selected && price !== null && (
        <p className="-mt-2 mb-0 text-xs text-(--n-neutral-400)">
          Prix actuel {money(price)}
          {side === "sell" && position && ` · détenu ${formatQuantity(position.quantity)} ${symbol}`}
        </p>
      )}

      <div className="n-field">
        <label htmlFor={ids.amount}>
          {side === "buy" ? `Montant à investir (${CURRENCY_SYMBOLS[currency]}, frais inclus)` : "Quantité à vendre"}
        </label>
        <div className="relative">
          <input
            id={ids.amount}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="0,00"
            className="n-text-input n-tnum pr-16!"
            aria-invalid={Boolean(amountText) && reason !== null && Boolean(selected)}
            aria-describedby={reason ? ids.reason : undefined}
          />
          <button
            type="button"
            className="n-btn absolute right-0.5 top-0.5 lg:right-1 lg:top-1 min-h-11 lg:min-h-8.5 px-3! text-[13px]! text-(--n-accent)! hover:bg-[color-mix(in_srgb,var(--n-accent)_10%,transparent)]"
            onClick={fillMax}
            disabled={side === "sell" && !position}
          >
            Max
          </button>
        </div>
      </div>

      <dl className="m-0 flex flex-col gap-2 text-sm lg:text-[13px] n-tnum">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-3">
            <dt className="text-(--n-neutral-400)">{r.label}</dt>
            <dd className={`m-0 ${r.strong ? "font-medium" : ""}`} style={r.color ? { color: r.color } : undefined}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      <button
        type="submit"
        disabled={!canSubmit}
        className="n-btn n-btn-primary w-full min-h-12 lg:min-h-10.5 max-lg:text-[15px]!"
      >
        {trading
          ? "Envoi de l’ordre…"
          : side === "buy"
            ? selected
              ? `Acheter du ${selected.name}`
              : "Acheter"
            : selected
              ? `Vendre du ${selected.name}`
              : "Vendre"}
      </button>

      {tradeError && (
        <p className="-mt-1 mb-0 text-sm text-(--n-down)" role="alert">
          {tradeError}
        </p>
      )}
      {reason && !tradeError && (
        <p id={ids.reason} className="-mt-1 mb-0 flex gap-2 text-xs leading-normal text-(--n-neutral-400)" role="status">
          <InfoIcon size={14} className="flex-none mt-0.5" />
          {reason}
        </p>
      )}
      <p className="m-0 text-[11px] leading-snug text-(--n-neutral-500)">
        L&apos;ordre est exécuté au prix du marché au moment de l&apos;envoi, qui peut légèrement différer du prix affiché.
      </p>
    </form>
  );
}
