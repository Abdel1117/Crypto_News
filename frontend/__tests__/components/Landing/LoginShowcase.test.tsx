import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginShowcase from "@/app/components/Landing/LoginShowcase";

describe("LoginShowcase", () => {
  it("renders the title, the favorites preview and the perks", () => {
    render(<LoginShowcase />);

    expect(
      screen.getByRole("heading", {
        name: "Connectez-vous ou créez votre compte",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("img", { name: /Aperçu de vos favoris/ })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("gives the panel a motion root with its parts hidden before hydration", () => {
    render(<LoginShowcase />);

    expect(
      screen.getByRole("complementary").hasAttribute("data-motion-root"),
    ).toBe(true);
    // The panel itself stays visible: its background must not pop in.
    expect(
      screen.getByRole("complementary").hasAttribute("data-motion-hide"),
    ).toBe(false);
    expect(
      screen.getByRole("heading").hasAttribute("data-motion-hide"),
    ).toBe(true);
  });
});
