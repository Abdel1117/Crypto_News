import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// ─── Component mocks ──────────────────────────────────────────────────────────

vi.mock("../../../app/components/Landing/LandingNav", () => ({
  default: () => <nav data-testid="landing-nav">Nav</nav>,
}));

vi.mock("../../../app/components/Landing/LandingHero", () => ({
  default: () => <section data-testid="landing-hero">Hero</section>,
}));

vi.mock("../../../app/components/Landing/DashboardPreview", () => ({
  default: () => <div data-testid="landing-preview">Preview</div>,
}));

vi.mock("../../../app/components/Landing/BetaBand", () => ({
  default: () => <section data-testid="landing-beta">Beta</section>,
}));

vi.mock("../../../app/components/Landing/LandingSections", () => ({
  PartnersStrip: () => (
    <section data-testid="landing-partners">Partners</section>
  ),
  Features: () => <section data-testid="landing-features">Features</section>,
  Contact: () => <section data-testid="landing-contact">Contact</section>,
  LandingFooter: () => <footer data-testid="landing-footer">Footer</footer>,
}));

import Home from "../../../app/(landing)/page";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Home page", () => {
  it("renders without crashing", () => {
    const { container } = render(<Home />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders every landing section in order", () => {
    render(<Home />);
    const ids = [
      "landing-nav",
      "landing-hero",
      "landing-preview",
      "landing-partners",
      "landing-beta",
      "landing-features",
      "landing-contact",
      "landing-footer",
    ];
    const nodes = ids.map((id) => screen.getByTestId(id));
    for (let i = 1; i < nodes.length; i++) {
      expect(
        nodes[i - 1].compareDocumentPosition(nodes[i]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("wraps the content in a main landmark", () => {
    render(<Home />);
    expect(screen.getByRole("main")).toBeTruthy();
  });
});
