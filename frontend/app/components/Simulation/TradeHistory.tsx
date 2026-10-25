"use client";

import React from "react";
import { useAppSelector } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import CoinAvatar from "@/app/ui/CoinAvatar/CoinAvatar";
import { DownloadSimpleIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import { formatFiatPrice } from "@/app/utils/Format/FrFormat/FrFormat";
import { formatQuantity } from "./usePortfolio";
import { downloadCsv, tradesToCsv } from "./tradesCsv";

const COLS =
  "grid-cols-[minmax(0,1.2fr)_90px_minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]";

const ROW_RULE =
  "linear-gradient(to right, transparent, color-mix(in srgb, var(--n-text) 8%, transparent) 48px, color-mix(in srgb, var(--n-text) 8%, transparent) calc(100% - 48px), transparent)";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const typeColor = (type: "buy" | "sell") =>
  type === "buy" ? "var(--n-up)" : "var(--n-down)";
const typeLabel = (type: "buy" | "sell") =>
  type === "buy" ? "Achat" : "Vente";

export default function TradeHistory() {
  const { currency } = useCurrency();
  const { trades } = useAppSelector((state) => state.simulation);
  const usdPerEur = useAppSelector((state) => state.exchangeRate.usdPerEur);
  // Trades are stored in EUR internally; convert to the display currency.
  const multiplier = currency === "usd" ? (usdPerEur ?? 1) : 1;
  const money = (v: number) => formatFiatPrice(v * multiplier, currency);

  const exportCsv = () => {
    const day = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `crypto-explorer-transactions-${day}.csv`,
      tradesToCsv(trades, currency, multiplier),
    );
  };

  return (
    <section
      className="flex flex-col gap-2 lg:rounded-lg lg:bg-(--n-surface) lg:px-5 lg:pt-4 lg:pb-2"
      aria-labelledby="history-title"
    >
      <div className="flex items-center">
        <h2 id="history-title" className="m-0 text-base">
          <span className="lg:hidden">Historique</span>
          <span className="hidden lg:inline">Historique des transactions</span>
        </h2>
        {trades.length > 0 && (
          <button
            type="button"
            className="hidden lg:inline-flex ml-auto items-center gap-1 p-0 border-0 bg-transparent cursor-pointer font-[inherit] text-[13px] text-(--n-accent) hover:text-(--n-accent-300)"
            onClick={exportCsv}
          >
            Exporter en CSV
            <DownloadSimpleIcon size={14} />
          </button>
        )}
      </div>

      {trades.length === 0 ? (
        <p className="n-panel lg:bg-transparent! m-0 px-3.5 py-4 lg:px-0 lg:pt-1 lg:pb-3 text-sm text-(--n-neutral-400)">
          Aucune transaction pour le moment.
        </p>
      ) : (
        <>
          <div
            role="table"
            aria-label="Historique des transactions"
            className="hidden lg:flex flex-col n-tnum"
          >
            <div
              role="row"
              className={`relative grid ${COLS} items-center py-1.5 text-[11px] tracking-[0.08em] uppercase text-[color-mix(in_srgb,var(--n-text)_60%,transparent)]`}
            >
              <span role="columnheader">Date</span>
              <span role="columnheader">Type</span>
              <span role="columnheader">Actif</span>
              <span role="columnheader" className="text-right">
                Quantité
              </span>
              <span role="columnheader" className="text-right">
                Prix
              </span>
              <span role="columnheader" className="text-right">
                Total
              </span>
              <div className="n-rule top-auto! bottom-0" />
            </div>
            {trades.map((trade) => (
              <div
                key={trade.id}
                role="row"
                className={`relative grid ${COLS} items-center min-h-[46px] text-sm`}
              >
                <span
                  role="cell"
                  className="text-(--n-neutral-400) whitespace-nowrap"
                >
                  {formatDate(trade.date)}
                </span>
                <span role="cell">
                  <span
                    className="n-tag border border-current"
                    style={{ color: typeColor(trade.type) }}
                  >
                    {typeLabel(trade.type)}
                  </span>
                </span>
                <span role="cell" className="flex items-center gap-2.5 min-w-0">
                  <CoinAvatar
                    image={trade.coinImage}
                    name={trade.coinName}
                    symbol={trade.coinSymbol}
                    size={22}
                  />
                  <span className="truncate">{trade.coinName}</span>
                </span>
                <span
                  role="cell"
                  className="text-right whitespace-nowrap text-(--n-neutral-300)"
                >
                  {formatQuantity(trade.amount)}
                </span>
                <span
                  role="cell"
                  className="text-right whitespace-nowrap text-(--n-neutral-300)"
                >
                  {money(trade.priceAtTrade)}
                </span>
                <span
                  role="cell"
                  className="text-right whitespace-nowrap font-medium"
                >
                  {money(trade.total)}
                </span>
                <div
                  className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
                  style={{ background: ROW_RULE }}
                />
              </div>
            ))}
          </div>

          <ul
            className="lg:hidden flex flex-col gap-px m-0 p-0 list-none rounded-lg overflow-hidden n-tnum"
            style={{
              background:
                "color-mix(in srgb, var(--n-text) 7%, var(--n-surface))",
            }}
          >
            {trades.map((trade) => (
              <li
                key={trade.id}
                className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 min-h-[58px] px-3.5 bg-(--n-surface)"
              >
                <CoinAvatar
                  image={trade.coinImage}
                  name={trade.coinName}
                  symbol={trade.coinSymbol}
                  size={24}
                />
                <span className="flex flex-col leading-[1.35] min-w-0">
                  <span className="text-sm truncate">
                    <span style={{ color: typeColor(trade.type) }}>
                      {typeLabel(trade.type)}
                    </span>{" "}
                    · {trade.coinName}
                  </span>
                  <span className="text-xs text-(--n-neutral-500)">
                    {formatDate(trade.date)}
                  </span>
                </span>
                <span className="flex flex-col items-end leading-[1.35]">
                  <span className="text-sm font-medium whitespace-nowrap">
                    {money(trade.total)}
                  </span>
                  <span className="text-xs text-(--n-neutral-500) whitespace-nowrap">
                    {formatQuantity(trade.amount)}{" "}
                    {trade.coinSymbol.toUpperCase()}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
