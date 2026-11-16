import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter-var" }),
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-nonce": "nonce-for-this-request" }),
}));
vi.mock("../../app/components/ThemeScript/ThemeScript", () => ({
  ThemeScript: ({ nonce }: { nonce?: string }) => (
    <script data-testid="theme-script" data-nonce={nonce} />
  ),
}));
vi.mock("../../app/providers/root-providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}));
vi.mock("../../app/components/TopLoader/TopLoader", () => ({
  default: () => <div data-testid="top-loader" />,
}));

vi.mock("../../app/context/Consent/ConsentContext", () => ({
  ConsentProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock("../../app/components/CookieBanner/CookieBanner", () => ({
  default: () => <div data-testid="cookie-banner" />,
}));

import RootLayout from "../../app/layout";

describe("RootLayout", () => {
  it("renders the providers, top loader and page children", async () => {
    render(await RootLayout({ children: <main>page content</main> }));

    expect(screen.getByTestId("providers")).toBeTruthy();
    expect(screen.getByTestId("top-loader")).toBeTruthy();
    expect(screen.getByTestId("cookie-banner")).toBeTruthy();
    expect(screen.getByText("page content")).toBeTruthy();
  });

  it("gives the theme script the request's nonce, for the Content-Security-Policy", async () => {
    render(await RootLayout({ children: <main /> }));
    const script = document.querySelector('[data-testid="theme-script"]');
    expect(script?.getAttribute("data-nonce")).toBe("nonce-for-this-request");
  });

  it("puts the whole site in the Nocturne theme with its font", async () => {
    const { container } = render(
      await RootLayout({ children: <main>page content</main> }),
    );
    const body = container.querySelector("body") ?? document.body;
    const html = container.closest("html") ?? document.documentElement;
    expect(
      body.className.includes("nocturne") ||
        html.innerHTML.includes('class="nocturne'),
    ).toBe(true);
  });
});
