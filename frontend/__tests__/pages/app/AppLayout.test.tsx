import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter-var" }),
}));

vi.mock("../../../app/components/AppShell/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">
      <main>{children}</main>
    </div>
  ),
}));

vi.mock("../../../app/components/SymbolsBootstrap/SymbolsBootstrap", () => ({
  default: () => null,
}));

import AppLayout, { metadata } from "../../../app/(app)/layout";

describe("AppLayout", () => {

  it("renders the children inside the shared shell", () => {
    render(
      <AppLayout>
        <span data-testid="child-node">child content</span>
      </AppLayout>,
    );
    expect(screen.getByTestId("app-shell")).toBeTruthy();
    expect(screen.getByRole("main").textContent).toContain("child content");
  });

  it("de-indexes the app pages", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
