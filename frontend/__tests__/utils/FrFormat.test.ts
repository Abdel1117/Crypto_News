import { describe, expect, it } from "vitest";
import {
  formatCompactFiat,
  formatFiatPrice,
  formatSignedPercent,
} from "@/app/utils/Format/FrFormat/FrFormat";

// Normalise the narrow / regular no-break spaces used by fr-FR formatting.
const plain = (s: string) => s.replace(/[  ]/g, " ");

describe("formatFiatPrice", () => {
  it("uses two decimals and the currency symbol above 1", () => {
    expect(plain(formatFiatPrice(72050, "eur"))).toBe("72 050,00 €");
    expect(plain(formatFiatPrice(128.4, "usd"))).toBe("128,40 $");
  });

  it("uses four decimals below 1", () => {
    expect(plain(formatFiatPrice(0.0712, "eur"))).toBe("0,0712 €");
  });

  it("keeps two significant digits for tiny prices", () => {
    expect(plain(formatFiatPrice(0.0000092, "eur"))).toBe("0,0000092 €");
  });

  it("returns a dash for non-finite values", () => {
    expect(formatFiatPrice(Number.NaN, "eur")).toBe("—");
  });
});

describe("formatSignedPercent", () => {
  it("prefixes positives with + and negatives with a true minus", () => {
    expect(plain(formatSignedPercent(1.823))).toBe("+1,82 %");
    expect(plain(formatSignedPercent(-0.87))).toBe("−0,87 %");
  });

  it("has no sign for zero", () => {
    expect(plain(formatSignedPercent(0))).toBe("0,00 %");
  });
});

describe("formatCompactFiat", () => {
  it("expresses large amounts in « Md »", () => {
    expect(plain(formatCompactFiat(2.431e12, "eur"))).toBe("2 431 Md €");
    expect(plain(formatCompactFiat(8.2e9, "eur"))).toBe("8,2 Md €");
  });

  it("expresses millions in « M »", () => {
    expect(plain(formatCompactFiat(940e6, "usd"))).toBe("940 M $");
  });

  it("falls back to the plain amount under a million", () => {
    expect(plain(formatCompactFiat(1234, "eur"))).toBe("1 234 €");
  });
});
