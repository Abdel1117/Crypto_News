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

import { HeroCard } from "../../app/ui/HeroCard/HeroCard";
import type { Article } from "../../app/(public)/blog/data";

const article: Article = {
  id: 1,
  title: "Bitcoin franchit les 100 000 $",
  category: "Bitcoin",
  author: "Alice Dupont",
  authorInitial: "A",
  date: "12 juin 2025",
  readTime: "5 min",
  excerpt: "excerpt",
  gradient: "from-yellow-950 via-orange-900 to-yellow-800",
};

describe("HeroCard", () => {
  it("renders the article title, category and author chip", () => {
    render(<HeroCard article={article} className="h-96" />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/blog/1");
    expect(link.className).toContain("h-96");
    expect(screen.getByText("Bitcoin franchit les 100 000 $")).toBeTruthy();
    expect(screen.getByText("Bitcoin")).toBeTruthy();
    expect(screen.getByText("Alice Dupont")).toBeTruthy();
  });
});
