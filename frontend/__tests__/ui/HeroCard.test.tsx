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
import type { ArticleSummary } from "../../app/lib/api/blog";

function makeArticle(overrides: Partial<ArticleSummary> = {}): ArticleSummary {
  return {
    id: 1,
    slug: "un-article",
    title: "Un article",
    excerpt: "excerpt",
    category: "Bitcoin",
    status: "published",
    author_name: "Alice Dupont",
    read_minutes: 5,
    published_at: "2025-06-12T10:00:00Z",
    updated_at: "2025-06-12T10:00:00Z",
    like_count: 0,
    comment_count: 0,
    ...overrides,
  };
}

const article = makeArticle({
  slug: "bitcoin-100k",
  title: "Bitcoin franchit les 100 000 $",
});

describe("HeroCard", () => {
  it("renders the article title, category and author chip", () => {
    render(<HeroCard article={article} className="h-96" />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/blog/bitcoin-100k");
    expect(link.className).toContain("h-96");
    expect(screen.getByText("Bitcoin franchit les 100 000 $")).toBeTruthy();
    expect(screen.getByText("Bitcoin")).toBeTruthy();
    expect(screen.getByText("Alice Dupont")).toBeTruthy();
    expect(screen.getByText("5 min de lecture")).toBeTruthy();
  });
});
