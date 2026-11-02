import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatFraction,
  parseDecimalInput,
  toApiDecimal,
} from "@/app/components/SimulationPro/format";
import { proTradesToCsv } from "@/app/components/SimulationPro/proTradesCsv";
import { makeTrade } from "../../lib/simulationProTestUtils";

describe("format helpers", () => {
  it("formats fractions as percentages", () => {
    expect(formatFraction(0.1234)).toMatch(/^12,3\s%$/);
    expect(formatFraction(null)).toBe("—");
  });

  it("picks a readable unit for holding times", () => {
    expect(formatDuration(0.0001)).toBe("< 1 min");
    expect(formatDuration(10 / 1440)).toBe("10 min");
    expect(formatDuration(5 / 24)).toBe("5 h");
    expect(formatDuration(3.5)).toBe("3,5 j");
    expect(formatDuration(null)).toBe("—");
  });

  it("reads French and English decimals", () => {
    expect(parseDecimalInput("1 234,56")).toBe(1234.56);
    expect(parseDecimalInput("1234.5")).toBe(1234.5);
    expect(parseDecimalInput("12 345")).toBe(12345);
    expect(parseDecimalInput("abc")).toBeNaN();
    expect(parseDecimalInput("")).toBeNaN();
  });

  it("writes API decimals rounded down, never above what's available", () => {
    expect(toApiDecimal(7500.999, 2)).toBe("7500.99");
    expect(toApiDecimal(0.04, 12)).toBe("0.04");
    expect(toApiDecimal(1001, 8)).toBe("1001");
  });
});

describe("proTradesToCsv", () => {
  it("writes a French CSV with fees and gains", () => {
    const csv = proTradesToCsv(
      [makeTrade({ side: "sell", realized_pnl: 12.5, taxable_gain: 10 })],
      "eur",
    );
    const [header, row] = csv.split("\n");
    expect(header).toContain("Frais (EUR)");
    expect(header).toContain("Plus-value fiscale (EUR)");
    expect(row).toContain("Vente");
    expect(row).toContain("12,50");
  });

  it("neutralizes formulas hidden in coin names", () => {
    const csv = proTradesToCsv([makeTrade({ name: "=HYPERLINK(\"x\")", symbol: "+cmd" })], "usd");
    const row = csv.split("\n")[1];
    expect(row).toContain("'=HYPERLINK");
    expect(row).toContain("'+CMD");
  });
});
