import { describe, expect, it } from "vitest";
import { previewChart } from "@/app/components/Landing/previewData";

describe("previewChart", () => {
  it("places the live dot on the last point of the line", () => {
    const lastY = Number(previewChart.line.trim().split(" ").at(-1)!.split(",")[1]);

    expect(previewChart.endY).toMatch(/^\d+(\.\d+)?%$/);
    expect(parseFloat(previewChart.endY)).toBeCloseTo((lastY / 300) * 100, 1);
  });
});
