import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  CategoryBadge,
  categoryStyle,
} from "../../app/ui/CategoryBadge/CategoryBadge";
import { CATEGORY_META, DEFAULT_HUE } from "../../app/(public)/blog/data";

describe("CategoryBadge", () => {
  it("tints a known category with its own hue", () => {
    const { container } = render(<CategoryBadge category="Bitcoin" />);
    expect(screen.getByText("Bitcoin")).toBeTruthy();
    const badge = container.firstElementChild as HTMLElement;
    expect(badge.className).toContain("n-cat");
    expect(badge.style.getPropertyValue("--cat-h")).toBe(
      String(CATEGORY_META.Bitcoin.hue),
    );
  });

  it("falls back to the accent hue for an unknown category", () => {
    expect(categoryStyle("Unknown")).toEqual({ "--cat-h": DEFAULT_HUE });
  });

  it("switches to light text over a cover", () => {
    const { container } = render(<CategoryBadge category="NFT" onCover />);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge.className).toContain("text-white/85");
    expect(badge.className).not.toContain("n-cat");
  });
});
