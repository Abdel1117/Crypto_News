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

import { GridCard } from "../../app/ui/GridCard/GridCard";
import type { Article } from "../../app/(public)/blog/data";

const article: Article = {
  id: 4,
  title: "NFT gaming refonte",
  category: "NFT",
  author: "Thomas Bernard",
  authorInitial: "T",
  date: "8 juin 2025",
  readTime: "4 min",
  excerpt: "excerpt",
  gradient: "from-pink-950 via-pink-900 to-pink-700",
};

describe("GridCard", () => {
  it("links to the article and shows its category/title/readTime", () => {
    render(<GridCard article={article} />);

    expect(screen.getByRole("link").getAttribute("href")).toBe("/blog/4");
    expect(screen.getByText("NFT gaming refonte")).toBeTruthy();
    expect(screen.getByText("4 min")).toBeTruthy();
  });
});
