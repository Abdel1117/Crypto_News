import { Currency } from "@/app/context/Curency/CurrencyContext";

/**
 * Mapping of currency codes to their symbols.
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  usd: "$",
  eur: "€",
};

/**
 * Mapping of currency codes to their quote symbols.
 */
export const QUOTE_CURRENCY_SYMBOLS: Record<Currency, string> = {
  usd: "USDT",
  eur: "EUR",
};
