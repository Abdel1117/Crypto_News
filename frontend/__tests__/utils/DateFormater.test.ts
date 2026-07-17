import { describe, expect, it, vi, afterEach } from "vitest";
import { getCurrentYear } from "../../app/utils/Date/DateFormater";

describe("getCurrentYear", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the current year", () => {
    expect(getCurrentYear()).toBe(new Date().getFullYear());
  });

  it("returns the year of a mocked system date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-06-15T00:00:00Z"));

    expect(getCurrentYear()).toBe(2030);
  });
});
