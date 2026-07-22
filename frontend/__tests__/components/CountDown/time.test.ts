import { describe, expect, it } from "vitest";
import { toTimestampMs, getCountDownParts, pad2 } from "../../../app/components/CountDown/time";

describe("toTimestampMs", () => {
  it("returns the timestamp of a Date", () => {
    const date = new Date("2030-01-01T00:00:00.000Z");
    expect(toTimestampMs(date)).toBe(date.getTime());
  });

  it("returns a number unchanged", () => {
    expect(toTimestampMs(12345)).toBe(12345);
  });

  it("parses a date string", () => {
    expect(toTimestampMs("2030-01-01T00:00:00.000Z")).toBe(
      new Date("2030-01-01T00:00:00.000Z").getTime(),
    );
  });

  it("returns NaN for an invalid string", () => {
    expect(Number.isNaN(toTimestampMs("not-a-date"))).toBe(true);
  });
});

describe("getCountDownParts", () => {
  it("splits a positive diff into days/hours/minutes/seconds", () => {
    const diff = 2 * 86400_000 + 3 * 3600_000 + 4 * 60_000 + 5_000;
    expect(getCountDownParts(diff, false)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
  });

  it("clamps a negative diff to zero when clampToZero is true", () => {
    expect(getCountDownParts(-1000, true)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it("returns negative parts when clampToZero is false", () => {
    const diff = -(3600_000 + 1000);
    expect(getCountDownParts(diff, false)).toEqual({ days: -0, hours: -1, minutes: -0, seconds: -1 });
  });
});

describe("pad2", () => {
  it("pads single-digit numbers with a leading zero", () => {
    expect(pad2(5)).toBe("05");
  });

  it("leaves two-digit numbers untouched", () => {
    expect(pad2(42)).toBe("42");
  });

  it("keeps the minus sign in front of the padded value", () => {
    expect(pad2(-5)).toBe("-05");
  });
});
