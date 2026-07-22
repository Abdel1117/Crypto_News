import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../app/components/Header/Header", () => ({
  default: () => <header>Header</header>,
}));
vi.mock("../../app/components/Footer/Footer", () => ({
  default: () => <footer>Footer</footer>,
}));
vi.mock("../../app/components/ParticleBg/ParticleBG", () => ({
  ParticlesBg: () => <div>Particles</div>,
}));

import PublicLayout from "../../app/(public)/layout";

describe("PublicLayout", () => {
  it("renders the header, particles background, children and footer", () => {
    render(
      <PublicLayout>
        <main>Page content</main>
      </PublicLayout>,
    );

    expect(screen.getByText("Header")).toBeTruthy();
    expect(screen.getByText("Particles")).toBeTruthy();
    expect(screen.getByText("Page content")).toBeTruthy();
    expect(screen.getByText("Footer")).toBeTruthy();
  });
});
