import type { PortfolioCurrency, ProTrade } from "@/app/lib/api/simulationPro";
import { neutralizeFormula } from "@/app/components/Simulation/tradesCsv";

const cell = (value: string) =>
  /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const text = (value: string) => cell(neutralizeFormula(value));

const num = (value: number | null, decimals: number) =>
  value === null ? "" : value.toFixed(decimals).replace(".", ",");

/**
 * Order history as CSV for a French spreadsheet (";" separator, decimal
 * comma). Coin names come from CoinGecko, so text cells are protected
 * against formula injection.
 */
export function proTradesToCsv(trades: ProTrade[], currency: PortfolioCurrency): string {
  const unit = currency.toUpperCase();
  const header = [
    "Date",
    "Type",
    "Actif",
    "Symbole",
    "Quantité",
    `Prix (${unit})`,
    `Frais (${unit})`,
    `Total (${unit})`,
    `PnL réalisé (${unit})`,
    `Plus-value fiscale (${unit})`,
  ].map(cell);
  const rows = trades.map((t) => [
    text(t.executed_at),
    t.side === "buy" ? "Achat" : "Vente",
    text(t.name),
    text(t.symbol.toUpperCase()),
    num(t.quantity, 12),
    num(t.price, 8),
    num(t.fee, 2),
    num(t.total, 2),
    num(t.realized_pnl, 2),
    num(t.taxable_gain, 2),
  ]);
  return [header, ...rows].map((r) => r.join(";")).join("\n");
}
