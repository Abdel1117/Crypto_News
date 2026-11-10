import { describe, expect, it } from "vitest";
import {
  formatArticleDate,
  formatRelative,
  initialOf,
  readTimeLabel,
} from "@/app/components/Blog/format";

const NOW = Date.parse("2026-11-09T12:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe("blog format", () => {
  it("writes dates the French way, in Paris time", () => {
    expect(formatArticleDate("2025-06-12T10:00:00Z")).toBe("12 juin 2025");
    // 23:30 UTC on Dec 31 is already Jan 1 in Paris.
    expect(formatArticleDate("2025-12-31T23:30:00Z")).toBe("1 janvier 2026");
    expect(formatArticleDate(null)).toBe("");
  });

  it("says how long ago a comment was posted", () => {
    expect(formatRelative(ago(10_000), NOW)).toBe("à l’instant");
    expect(formatRelative(ago(5 * 60_000), NOW)).toBe("il y a 5 minutes");
    expect(formatRelative(ago(3 * 3_600_000), NOW)).toBe("il y a 3 heures");
    expect(formatRelative(ago(24 * 3_600_000), NOW)).toBe("hier");
    expect(formatRelative("2026-10-01T10:00:00Z", NOW)).toBe("1 octobre 2026");
  });

  it("labels reading time and initials", () => {
    expect(readTimeLabel(7)).toBe("7 min");
    expect(initialOf(" élise ")).toBe("É");
    expect(initialOf("")).toBe("?");
  });
});
