import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryBadge } from "../../app/ui/CategoryBadge/CategoryBadge";

describe("CategoryBadge", () => {
  it("renders a known category with its themed color", () => {
    const { container } = render(<CategoryBadge category="Bitcoin" />);
    expect(screen.getByText("Bitcoin")).toBeTruthy();
    expect(container.querySelector("span")?.className).toContain("text-yellow-400");
  });

  it("falls back to the default color for an unknown category", () => {
    const { container } = render(<CategoryBadge category="Unknown" />);
    expect(container.querySelector("span")?.className).toContain("text-primary");
  });
});
