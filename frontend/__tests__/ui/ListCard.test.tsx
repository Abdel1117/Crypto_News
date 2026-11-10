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

import { ListCard } from "../../app/ui/ListCard/ListCard";
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
    cover_image: null,
    cover_alt: null,
    ...overrides,
  };
}

const article = makeArticle({
  id: 5,
  slug: "solana-vs-avalanche",
  title: "Solana vs Avalanche",
  category: "Altcoins",
  read_minutes: 8,
  published_at: "2025-06-07T10:00:00Z",
});

describe("ListCard", () => {
  it("shows the rank, category, title and date", () => {
    render(<ListCard article={article} index={2} />);

    expect(screen.getByRole("link").getAttribute("href")).toBe("/blog/solana-vs-avalanche");
    expect(screen.getByText("03")).toBeTruthy();
    expect(screen.getByText("Solana vs Avalanche")).toBeTruthy();
    expect(screen.getByText(/8 min · 7 juin 2025/)).toBeTruthy();
  });

  it("keeps the rank over the cover image", () => {
    const { container } = render(
      <ListCard article={makeArticle({ cover_image: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", cover_alt: "Un graphique" })} index={0} />,
    );
    expect(container.querySelector("img")?.getAttribute("sizes")).toBe("64px");
    expect(screen.getByText("01")).toBeTruthy();
  });
});
