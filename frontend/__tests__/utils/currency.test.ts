import { describe, expect, it } from "vitest";
import {
  CURRENCY_SYMBOLS,
  QUOTE_CURRENCY_SYMBOLS,
} from "../../app/utils/constants/currency";

describe("currency constants", () => {
  it("maps currency codes to their display symbols", () => {
    expect(CURRENCY_SYMBOLS.usd).toBe("$");
    expect(CURRENCY_SYMBOLS.eur).toBe("€");
  });

  it("maps currency codes to their quote symbols", () => {
    expect(QUOTE_CURRENCY_SYMBOLS.usd).toBe("USDT");
    expect(QUOTE_CURRENCY_SYMBOLS.eur).toBe("EUR");
  });
});
