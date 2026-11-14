/** Formatting helpers for the logged-in simulation (French conventions). */

/** A fraction as a percentage: 0.1234 → "12,3 %"; null → "—". */
export function formatFraction(value: number | null, decimals = 1): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return (
    (value * 100).toLocaleString("fr-FR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + " %"
  );
}

/** A holding time in days, in the most readable unit: "12 min", "5 h", "3 j". */
export function formatDuration(days: number | null): string {
  if (days === null || !Number.isFinite(days)) return "—";
  const minutes = days * 24 * 60;
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} h`;
  return `${days.toLocaleString("fr-FR", { maximumFractionDigits: days < 10 ? 1 : 0 })} j`;
}

/** "12 nov. 2026, 14:05" */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "2 novembre 2026" */
export function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Reads "1 234,56" or "1234.56" (\s also covers the non-breaking spaces of
 * French number formatting). NaN when it isn't a number.
 */
export function parseDecimalInput(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  // Digits, optionally followed by a dot and more digits.
  if (!/^\d*(?:\.\d*)?$/.test(cleaned) || cleaned === "" || cleaned === ".") return Number.NaN;
  return Number(cleaned);
}

/** "12.3400" → "12.34", "5.000" → "5" (the dot goes when no digit follows it). */
function trimTrailingZeros(fixed: string): string {
  let end = fixed.length;
  while (end > 0 && fixed[end - 1] === "0") end--;
  if (end < fixed.length && fixed[end - 1] === ".") end--;
  return fixed.slice(0, end);
}

/**
 * A number as the API expects it: a dot as decimal separator, at most
 * `decimals` digits, rounded down so a "Max" never exceeds what is available.
 */
export function toApiDecimal(value: number, decimals: number): string {
  const factor = 10 ** decimals;
  const floored = Math.floor(value * factor + 1e-9) / factor;
  return trimTrailingZeros(floored.toFixed(decimals)) || "0";
}
