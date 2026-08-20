/**
 * Formats a large number into a compact currency string using SI-style suffixes (K, M, B, T).
 * @example formatCurrencyCompact(1200000000000, "€") // "1.2T €"
 * @example formatCurrencyCompact(35000000000, "€") // "35B €"
 */
export function formatCurrencyCompact(value: number, symbol: string): string {
  if (!Number.isFinite(value)) return "";

  const compact = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

  return `${compact} ${symbol}`;
}
