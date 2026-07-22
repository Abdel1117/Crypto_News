import { describe, expect, it } from "vitest";
import { formatPrice } from "../../app/utils/Format/PriceFormat/PriceFormat";

describe("formatPrice", () => {
  it("formats a price with thousand separators and a currency suffix", () => {
    expect(formatPrice(12030.59395, "€")).toBe("12.030,59€");
  });

  it("respects a custom number of decimals", () => {
    expect(formatPrice(1234.567, "$", 1)).toBe("1.234,6$");
  });

  it("formats small prices without grouping", () => {
    expect(formatPrice(42.5, "€")).toBe("42,50€");
  });
});
