import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../app/lib/initSocket", () => ({
  initSocket: vi.fn(),
}));
vi.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { Providers } from "../../app/providers/root-providers";

describe("Providers (root-providers)", () => {
  it("renders children through the full provider stack", () => {
    render(
      <Providers>
        <span>content</span>
      </Providers>,
    );
    expect(screen.getByText("content")).toBeTruthy();
  });
});
