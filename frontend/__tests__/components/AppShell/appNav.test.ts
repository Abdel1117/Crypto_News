import { describe, expect, it } from "vitest";
import {
  APP_NAV,
  isCurrent,
  pageConfig,
  pageTitle,
} from "@/app/components/AppShell/appNav";

describe("appNav", () => {
  it("only lists pages that exist", () => {
    expect(APP_NAV.map((i) => i.href)).toEqual([
      "/",
      "/dashboard",
      "/simulation",
      "/heatmap",
    ]);
  });

  it("derives the top bar title from the path", () => {
    expect(pageTitle("/dashboard")).toBe("Dashboard");
    expect(pageTitle("/settings")).toBe("Paramètres");
    expect(pageTitle("/simulation/abc")).toBe("Portefeuille virtuel");
    expect(pageTitle("/heatmap")).toBe("Heatmap du marché");
    expect(pageTitle("/unknown")).toBe("Crypto-Explorer");
  });

  it("configures the top bar per page", () => {
    expect(pageConfig("/dashboard").search).toBe(true);
    expect(pageConfig("/simulation").search).toBeFalsy();
    expect(pageConfig("/simulation").tag?.desktop).toBe("Argent fictif");
    expect(pageConfig("/profil").currency).toBeFalsy();
  });

  it("marks the current link without matching every path for /", () => {
    expect(isCurrent("/", "/")).toBe(true);
    expect(isCurrent("/dashboard", "/")).toBe(false);
    expect(isCurrent("/heatmap", "/heatmap")).toBe(true);
    expect(isCurrent("/heatmapx", "/heatmap")).toBe(false);
  });
});
