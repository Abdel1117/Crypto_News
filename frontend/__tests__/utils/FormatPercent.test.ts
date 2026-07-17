import { describe, expect, it } from "vitest";
import {
  getPercentColor,
  formatPercentValue,
} from "../../app/utils/Format/FormatPercent/FormatPercent";

describe("getPercentColor", () => {
  it("returns the positive color for a positive value", () => {
    expect(getPercentColor(0.1)).toBe("text-success");
  });

  it("returns the negative color for a negative value", () => {
    expect(getPercentColor(-0.2)).toBe("text-red-500");
  });

  it("returns the neutral color for zero", () => {
    expect(getPercentColor(0)).toBe("text-neutral-500");
  });

  it("returns the neutral color for NaN", () => {
    expect(getPercentColor(NaN)).toBe("text-neutral-500");
  });

  it("supports custom colors", () => {
    expect(getPercentColor(1, "pos", "neg", "neu")).toBe("pos");
    expect(getPercentColor(-1, "pos", "neg", "neu")).toBe("neg");
    expect(getPercentColor(0, "pos", "neg", "neu")).toBe("neu");
  });
});

describe("formatPercentValue", () => {
  it("prefixes positive values with a plus sign", () => {
    expect(formatPercentValue(56.44)).toBe("+56.44%");
  });

  it("keeps the minus sign for negative values", () => {
    expect(formatPercentValue(-2.5)).toBe("-2.50%");
  });

  it("returns 0.00% for zero", () => {
    expect(formatPercentValue(0)).toBe("0.00%");
  });

  it("returns an empty string for NaN", () => {
    expect(formatPercentValue(NaN)).toBe("");
  });

  it("respects a custom decimals count", () => {
    expect(formatPercentValue(1.23456, 4)).toBe("+1.2346%");
  });
});
