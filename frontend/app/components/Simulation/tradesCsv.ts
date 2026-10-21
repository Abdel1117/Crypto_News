import type { Currency } from "@/app/context/Curency/CurrencyContext";
import type { Trade } from "@/app/lib/features/simulation/simulationSlice";

const cell = (value: string) =>
  /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const num = (value: number, decimals: number) =>
  value.toFixed(decimals).replace(".", ",");

/**
 * Trade history as CSV for a French spreadsheet: ";" separator, decimal
 * comma, amounts in the display currency.
 */
export function tradesToCsv(
  trades: Trade[],
  currency: Currency,
  multiplier: number,
): string {
  const header = [
    "Date",
    "Type",
    "Actif",
    "Symbole",
    "Quantité",
    `Prix (${currency.toUpperCase()})`,
    `Total (${currency.toUpperCase()})`,
  ];
  const rows = trades.map((t) => [
    t.date,
    t.type === "buy" ? "Achat" : "Vente",
    t.coinName,
    t.coinSymbol.toUpperCase(),
    num(t.amount, 6),
    num(t.priceAtTrade * multiplier, 6),
    num(t.total * multiplier, 2),
  ]);
  return [header, ...rows].map((r) => r.map(cell).join(";")).join("\n");
}

/** Triggers the download of the CSV in the browser. */
export function downloadCsv(filename: string, csv: string) {
  // BOM so Excel reads the accents as UTF-8.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
