"use client";

import CoinAvatar from "@/app/ui/CoinAvatar/CoinAvatar";
import type { PortfolioCurrency, ProTrade } from "@/app/lib/api/simulationPro";
import { formatFiatPrice } from "@/app/utils/Format/FrFormat/FrFormat";
import { DownloadSimpleIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import { downloadCsv } from "@/app/components/Simulation/tradesCsv";
import { formatQuantity, signedFiat, trendColor } from "@/app/components/Simulation/usePortfolio";
import { formatDateTime } from "./format";
import { proTradesToCsv } from "./proTradesCsv";

interface ProTradeHistoryProps {
  trades: ProTrade[];
  total: number;
  currency: PortfolioCurrency;
}

/** Every order, newest first, with its fee and (for sells) the realized PnL. */
export default function ProTradeHistory({ trades, total, currency }: Readonly<ProTradeHistoryProps>) {
  const money = (v: number) => formatFiatPrice(v, currency);

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`simulation-ordres-${stamp}.csv`, proTradesToCsv(trades, currency));
  };

  return (
    <section className="n-panel flex flex-col gap-3 px-5 py-4" aria-labelledby="pro-history-title">
      <div className="flex items-center gap-3">
        <h2 id="pro-history-title" className="m-0 mr-auto text-base">
          Historique des ordres
          {total > 0 && <span className="ml-2 text-[13px] font-normal text-(--n-neutral-500)">{total}</span>}
        </h2>
        {trades.length > 0 && (
          <button type="button" className="n-btn n-btn-secondary text-[13px]!" onClick={exportCsv}>
            <DownloadSimpleIcon size={16} />
            Exporter (CSV)
          </button>
        )}
      </div>

      {trades.length === 0 ? (
        <p className="m-0 text-sm text-(--n-neutral-400)">Aucun ordre pour le moment.</p>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-col n-tnum" aria-label="Ordres passés">
          {trades.map((t) => (
            <li
              key={t.id}
              className="grid grid-cols-[28px_minmax(0,1fr)_auto] gap-3 items-center py-2.5 border-b border-(--n-divider) last:border-b-0 text-sm"
            >
              <CoinAvatar image={t.image} name={t.name} symbol={t.symbol} size={28} />
              <span className="flex flex-col min-w-0 leading-[1.35]">
                <span className="truncate">
                  <span
                    className="font-medium"
                    style={{ color: t.side === "buy" ? "var(--n-up)" : "var(--n-down)" }}
                  >
                    {t.side === "buy" ? "Achat" : "Vente"}
                  </span>{" "}
                  {formatQuantity(t.quantity)} {t.symbol.toUpperCase()} à {money(t.price)}
                </span>
                <span className="text-xs text-(--n-neutral-500) truncate">
                  {formatDateTime(t.executed_at)} · frais {money(t.fee)}
                </span>
              </span>
              <span className="flex flex-col items-end leading-[1.35] whitespace-nowrap">
                <span className="font-medium">
                  {t.side === "buy" ? "−" : "+"}
                  {money(t.total)}
                </span>
                {t.realized_pnl !== null && (
                  <span className="text-xs" style={{ color: trendColor(t.realized_pnl) }}>
                    PnL {signedFiat(t.realized_pnl, currency)}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
