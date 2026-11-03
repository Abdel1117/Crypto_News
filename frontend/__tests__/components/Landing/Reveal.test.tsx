import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const presets = vi.hoisted(() => ({
  partnersReveal: vi.fn(),
  featuresReveal: vi.fn(),
  contactReveal: vi.fn(),
  previewIntro: vi.fn(),
}));

vi.mock("@/app/components/Landing/motion/landingMotion", () => presets);

import Reveal from "@/app/components/Landing/motion/Reveal";

describe("Reveal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a section that the pre-hydration CSS can hide", () => {
    render(
      <Reveal preset="features" id="fonctionnalites" aria-label="Fonctionnalités">
        <h2>Titre</h2>
      </Reveal>,
    );

    const section = screen.getByRole("region", { name: "Fonctionnalités" });
    expect(section.tagName).toBe("SECTION");
    expect(section.id).toBe("fonctionnalites");
    expect(section.hasAttribute("data-motion-root")).toBe(true);
    expect(section.hasAttribute("data-motion-hide")).toBe(true);
    expect(screen.getByText("Titre")).toBeTruthy();
  });

  it("can render a div", () => {
    render(<Reveal as="div" preset="preview" role="img" aria-label="Aperçu" />);
    expect(screen.getByRole("img", { name: "Aperçu" }).tagName).toBe("DIV");
  });

  it("runs the animation matching its preset", () => {
    // Inline opacity stands in for the pre-hydration CSS.
    render(<Reveal preset="contact" data-testid="root" style={{ opacity: 0 }} />);

    const root = screen.getByTestId("root");
    expect(presets.contactReveal).toHaveBeenCalledWith(root);
    expect(presets.featuresReveal).not.toHaveBeenCalled();
  });
});
