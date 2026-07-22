import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next/image", () => ({
  default: ({ src, alt, priority, ...props }: any) => (
    <img src={typeof src === "string" ? src : "img"} alt={alt} {...props} />
  ),
}));
vi.mock("@/public/images/payment_icons/logo-visa.png", () => ({ default: "/visa.png" }));
vi.mock("@/public/images/payment_icons/pay-pal.png", () => ({ default: "/paypal.png" }));
vi.mock("@/public/images/payment_icons/contactless.png", () => ({ default: "/contactless.png" }));
vi.mock("@/public/images/payment_icons/bitcoin.png", () => ({ default: "/bitcoin.png" }));
vi.mock("../../app/components/Hero/HeroCountDown", () => ({
  HeroCountDown: () => <div>HeroCountDown</div>,
}));
vi.mock("../../app/lib/hooks", () => ({
  useAppSelector: vi.fn(),
}));

import { useAppSelector } from "../../app/lib/hooks";
import Hero from "../../app/components/Hero/Hero";

describe("Hero", () => {
  it("links the CTA to the dashboard when authenticated", () => {
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({ auth: { isAuthenticated: true } }),
    );
    render(<Hero />);

    expect(screen.getByText("Lancer la démo").closest("a")?.getAttribute("href")).toBe(
      "/dashboard",
    );
  });

  it("links the CTA to the login page when not authenticated", () => {
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({ auth: { isAuthenticated: false } }),
    );
    render(<Hero />);

    expect(screen.getByText("Lancer la démo").closest("a")?.getAttribute("href")).toBe("/login");
    expect(screen.getByText("HeroCountDown")).toBeTruthy();
  });
});
