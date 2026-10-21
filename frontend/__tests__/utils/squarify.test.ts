import { describe, expect, it } from "vitest";
import { squarify } from "@/app/utils/Treemap/squarify";

const items = [60, 30, 6, 4].map((v, i) => ({ id: `c${i}`, v }));

describe("squarify", () => {
  it("fills the box with areas proportional to the values", () => {
    const rects = squarify(items, (i) => i.v, 200, 100);
    expect(rects).toHaveLength(4);
    const total = rects.reduce((s, r) => s + r.w * r.h, 0);
    expect(total).toBeCloseTo(200 * 100);
    rects.forEach((r) => {
      expect((r.w * r.h) / (200 * 100)).toBeCloseTo(r.item.v / 100);
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(200 + 1e-6);
      expect(r.y + r.h).toBeLessThanOrEqual(100 + 1e-6);
    });
  });

  it("keeps tiles reasonably square", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ v: 20 - i }));
    const rects = squarify(many, (i) => i.v, 400, 300);
    const worst = Math.max(
      ...rects.map((r) => Math.max(r.w / r.h, r.h / r.w)),
    );
    expect(worst).toBeLessThan(4);
  });

  it("returns nothing for an empty box or empty values", () => {
    expect(squarify(items, (i) => i.v, 0, 100)).toEqual([]);
    expect(squarify([{ v: 0 }], (i) => i.v, 100, 100)).toEqual([]);
  });
});
