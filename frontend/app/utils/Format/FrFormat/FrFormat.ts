import type { Currency } from "@/app/context/Curency/CurrencyContext";
import { CURRENCY_SYMBOLS } from "@/app/utils/constants/currency";

const NBSP = " ";
const NNBSP = " ";

function nf(value: number, min: number, max: number) {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}

/**
 * Formats a fiat price the French way, with precision adapted to the magnitude.
 *
 * @example formatFiatPrice(72050, "eur")   // "72 050,00 €"
 * @example formatFiatPrice(0.0712, "eur")  // "0,0712 €"
 * @example formatFiatPrice(0.0000092, "usd") // "0,0000092 $"
 */
export function formatFiatPrice(value: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  if (!Number.isFinite(value)) return "—";
  if (value !== 0 && Math.abs(value) < 0.01) {
    return (
      value.toLocaleString("fr-FR", { maximumSignificantDigits: 2 }) +
      NBSP +
      symbol
    );
  }
  const decimals = Math.abs(value) < 1 ? 4 : 2;
  return nf(value, decimals, decimals) + NBSP + symbol;
}

/**
 * Formats an already-in-percent value with an explicit sign and a true minus.
 *
 * @example formatSignedPercent(1.823)  // "+1,82 %"
 * @example formatSignedPercent(-0.87)  // "−0,87 %"
 */
export function formatSignedPercent(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return sign + nf(Math.abs(value), decimals, decimals) + NNBSP + "%";
}

/**
 * Formats large amounts in millions / billions (« M » / « Md »).
 *
 * @example formatCompactFiat(2.431e12, "eur") // "2 431 Md €"
 * @example formatCompactFiat(8.2e9, "eur")    // "8,2 Md €"
 * @example formatCompactFiat(940e6, "usd")    // "940 M $"
 */
export function formatCompactFiat(value: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1e9) {
    const d = Math.abs(value) >= 1e11 ? 0 : 1;
    return nf(value / 1e9, d, d) + NBSP + "Md" + NBSP + symbol;
  }
  if (Math.abs(value) >= 1e6) {
    return nf(value / 1e6, 0, 0) + NBSP + "M" + NBSP + symbol;
  }
  return nf(value, 0, 0) + NBSP + symbol;
}
