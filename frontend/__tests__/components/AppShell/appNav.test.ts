import { describe, expect, it } from "vitest";
import {
  APP_NAV,
  isCurrent,
  navItems,
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
      "/blog",
      "/redaction",
    ]);
  });

  it("shows the editors' desk to editors and admins only", () => {
    const hrefs = (role?: "user" | "editor" | "admin") =>
      navItems(role).map((i) => i.href);
    expect(hrefs()).not.toContain("/redaction");
    expect(hrefs("user")).not.toContain("/redaction");
    expect(hrefs("editor")).toContain("/redaction");
    expect(hrefs("admin")).toContain("/redaction");
    expect(hrefs("user")).toContain("/blog");
  });

  it("keeps the mobile tab bar to four pages (plus Profil)", () => {
    expect(navItems("admin", { mobile: true }).map((i) => i.href)).toEqual([
      "/",
      "/dashboard",
      "/simulation",
      "/heatmap",
    ]);
  });

  it("titles the editorial pages", () => {
    expect(pageTitle("/redaction")).toBe("Rédaction");
    expect(pageTitle("/redaction/12")).toBe("Rédaction");
    expect(pageTitle("/redaction/nouveau")).toBe("Nouvel article");
    expect(pageTitle("/redaction/equipe")).toBe("Équipe");
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

  it("adapts the simulation page to the login state", () => {
    const loggedOut = pageConfig("/simulation", { isAuthenticated: false });
    expect(loggedOut.tag?.mobile).toBe("Bêta");
    expect(loggedOut.currency).toBe(true);

    const loggedIn = pageConfig("/simulation", { isAuthenticated: true });
    expect(loggedIn.tag?.desktop).toBe("Argent fictif");
    expect(loggedIn.currency).toBe(false);

    expect(pageConfig("/dashboard", { isAuthenticated: true }).currency).toBe(true);
  });

  it("marks the current link without matching every path for /", () => {
    expect(isCurrent("/", "/")).toBe(true);
    expect(isCurrent("/dashboard", "/")).toBe(false);
    expect(isCurrent("/heatmap", "/heatmap")).toBe(true);
    expect(isCurrent("/heatmapx", "/heatmap")).toBe(false);
  });
});
