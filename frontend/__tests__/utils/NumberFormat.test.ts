import { describe, expect, it } from "vitest";
import { formatNumberToCurrency } from "../../app/utils/Format/NumberFormat/NumberFormat";

describe("formatNumberToCurrency", () => {
  it("groups digits with spaces from a number", () => {
    expect(formatNumberToCurrency(1234567.89)).toBe("1 234 567");
  });

  it("groups digits with spaces from a numeric string", () => {
    expect(formatNumberToCurrency("9876543.21")).toBe("9 876 543");
  });

  it("drops decimals by flooring the value", () => {
    expect(formatNumberToCurrency(999.99)).toBe("999");
  });

  it("handles small numbers without grouping", () => {
    expect(formatNumberToCurrency(42)).toBe("42");
  });

  it("handles negative numbers", () => {
    expect(formatNumberToCurrency(-1234567)).toBe("-1 234 567");
  });

  it("returns an empty string for invalid input", () => {
    expect(formatNumberToCurrency("not-a-number")).toBe("");
  });
});
