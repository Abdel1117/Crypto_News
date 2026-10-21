import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter-var" }),
}));
vi.mock("../../app/components/ThemeScript/ThemeScript", () => ({
  ThemeScript: () => <script data-testid="theme-script" />,
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
  it("renders the providers, top loader and page children", () => {
    render(
      <RootLayout>
        <main>page content</main>
      </RootLayout>,
    );

    expect(screen.getByTestId("providers")).toBeTruthy();
    expect(screen.getByTestId("top-loader")).toBeTruthy();
    expect(screen.getByTestId("cookie-banner")).toBeTruthy();
    expect(screen.getByText("page content")).toBeTruthy();
  });

  it("puts the whole site in the Nocturne theme with its font", () => {
    const { container } = render(
      <RootLayout>
        <main>page content</main>
      </RootLayout>,
    );
    const body = container.querySelector("body") ?? document.body;
    const html = container.closest("html") ?? document.documentElement;
    expect(
      body.className.includes("nocturne") ||
        html.innerHTML.includes('class="nocturne'),
    ).toBe(true);
  });
});
