import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const openPreferencesPanel = vi.fn();
let pathname = "/mentions-legales";

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("@/app/lib/hooks", () => ({
  useAppSelector: (selector: (s: unknown) => unknown) =>
    selector({ auth: { isAuthenticated: false } }),
}));
vi.mock("@/app/context/Theme/ThemeContext", () => ({
  useTheme: () => ({ theme: "dark", toggleTheme: vi.fn() }),
}));
vi.mock("@/app/context/Consent/ConsentContext", () => ({
  useConsent: () => ({ openPreferencesPanel }),
}));

import LandingNav from "@/app/components/Landing/LandingNav";
import { LandingFooter } from "@/app/components/Landing/LandingSections";

describe("Public pages chrome", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks only the current page in the navigation", () => {
    pathname = "/";
    render(<LandingNav />);
    expect(
      screen
        .getByRole("link", { name: "Accueil" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      screen
        .getByRole("link", { name: "Dashboard" })
        .getAttribute("aria-current"),
    ).toBeNull();
  });

  it("points « Contact » to the landing page section from any page", () => {
    pathname = "/blog";
    render(<LandingNav />);
    expect(
      screen.getByRole("link", { name: "Contact" }).getAttribute("href"),
    ).toBe("/#contact");
    expect(
      screen
        .getByRole("link", { name: "Accueil" })
        .getAttribute("aria-current"),
    ).toBeNull();
  });

  it("says « Connexion », not « Login »", () => {
    render(<LandingNav />);
    expect(screen.getByRole("link", { name: "Connexion" })).toBeTruthy();
    expect(screen.queryByText("Login")).toBeNull();
  });

  it("reopens the cookie preferences from the footer", () => {
    render(<LandingFooter />);
    fireEvent.click(screen.getByRole("button", { name: "Cookies" }));
    expect(openPreferencesPanel).toHaveBeenCalled();
  });
});
