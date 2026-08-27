import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
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

vi.mock("../../app/consent/useConsent", () => ({
  ConsentProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../../app/consent/components/CookieBanner", () => ({
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
});
