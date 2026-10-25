import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../app/components/Landing/LandingNav", () => ({
  default: () => <nav>Navigation</nav>,
}));
vi.mock("../../app/components/Landing/LandingSections", () => ({
  LandingFooter: () => <footer>Pied de page</footer>,
}));

import PublicLayout from "../../app/(public)/layout";

describe("PublicLayout", () => {
  it("wraps the page in the landing navigation and footer", () => {
    render(
      <PublicLayout>
        <main>Page content</main>
      </PublicLayout>,
    );

    const nav = screen.getByText("Navigation");
    const main = screen.getByText("Page content");
    const footer = screen.getByText("Pied de page");
    expect(
      nav.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      main.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("no longer draws the particle background", () => {
    const { container } = render(
      <PublicLayout>
        <main>x</main>
      </PublicLayout>,
    );
    expect(container.querySelector("canvas")).toBeNull();
  });
});
