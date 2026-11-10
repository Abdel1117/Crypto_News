import type { Currency } from "@/app/context/Curency/CurrencyContext";
import type { AlertDirection, PriceAlert } from "@/app/lib/api/alerts";
import { parseDecimalInput } from "@/app/components/SimulationPro/format";
import { CURRENCY_SYMBOLS } from "@/app/utils/constants/currency";

const NBSP = " ";
// The API's limits: the column holds 12 decimals and 18 digits before the point.
const MAX_DECIMALS = 12;
const MAX_THRESHOLD = 1e18;

/**
 * The threshold exactly as typed, with a dot as decimal separator. The text is
 * sent rather than a parsed number: "85000.1" stays exact, a float wouldn't.
 */
export function toApiThreshold(text: string): string {
  return text.replace(/\s/g, "").replace(",", ".");
}

interface BlockerInput {
  hasCoin: boolean;
  thresholdText: string;
  direction: AlertDirection;
  price: number | null;
}

/** Why the alert can't be created yet, or null when nothing stands in the way. */
export function alertBlocker({
  hasCoin,
  thresholdText,
  direction,
  price,
}: BlockerInput): string | null {
  if (!hasCoin) return "Cherche et choisis une crypto.";
  if (!thresholdText.trim()) return null;

  const threshold = parseDecimalInput(thresholdText);
  if (!Number.isFinite(threshold) || threshold <= 0) return "Seuil invalide.";
  if (threshold >= MAX_THRESHOLD) return "Seuil trop élevé.";
  const decimals = toApiThreshold(thresholdText).split(".")[1]?.length ?? 0;
  if (decimals > MAX_DECIMALS) return `${MAX_DECIMALS} décimales au maximum.`;

  // The server checks this too; here it just saves a round trip.
  if (price !== null) {
    if (direction === "below" && price <= threshold) {
      return "Le prix est déjà sous ce seuil.";
    }
    if (direction === "above" && price >= threshold) {
      return "Le prix est déjà au-dessus de ce seuil.";
    }
  }
  return null;
}

/**
 * A threshold or trigger price, keeping what the user typed: tiny prices aren't
 * rounded the way formatFiatPrice does for market data ("0,00001234 €").
 * The limits also hide float noise such as 1234567.1200000001.
 */
export function formatAlertPrice(value: number, currency: Currency): string {
  const digits =
    value >= 1
      ? { minimumFractionDigits: 2, maximumFractionDigits: 6 }
      : { maximumSignificantDigits: 10 };
  return value.toLocaleString("fr-FR", digits) + NBSP + CURRENCY_SYMBOLS[currency];
}

/** "Sous 50 000,00 €" */
export function describeRule(
  alert: Pick<PriceAlert, "direction" | "threshold" | "currency">,
): string {
  const position = alert.direction === "below" ? "Sous" : "Au-dessus de";
  return `${position} ${formatAlertPrice(alert.threshold, alert.currency)}`;
}

/** "toutes les 10 minutes" */
export function describeInterval(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return minutes <= 1 ? "chaque minute" : `toutes les ${minutes} minutes`;
}
