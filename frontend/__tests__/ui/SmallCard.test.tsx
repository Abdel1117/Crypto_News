import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { vi } from "vitest";
import { SmallCard } from "../../app/ui/SmallCard/SmallCard";
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
  id: 3,
  slug: "defi-yields",
  title: "DeFi yields",
  category: "DeFi",
  author_name: "Sophie Martin",
  read_minutes: 6,
});

describe("SmallCard", () => {
  it("links to the article page and shows its metadata", () => {
    render(<SmallCard article={article} />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/blog/defi-yields");
    expect(screen.getByText("DeFi yields")).toBeTruthy();
    expect(screen.getByText("Sophie Martin")).toBeTruthy();
    expect(screen.getByText("6 min de lecture")).toBeTruthy();
    expect(screen.getByText("S")).toBeTruthy();
    expect(screen.getByText("DeFi")).toBeTruthy();
  });
});
