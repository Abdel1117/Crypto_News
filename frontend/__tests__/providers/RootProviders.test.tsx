import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../app/lib/initSocket", () => ({
  initSocket: vi.fn(),
}));
vi.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../../app/lib/auth/api", () => ({
  refreshAccessToken: vi.fn(() => Promise.reject(new Error("no session"))),
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
