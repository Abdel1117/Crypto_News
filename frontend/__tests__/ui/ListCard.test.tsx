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
import type { Article } from "../../app/(public)/blog/data";

const article: Article = {
  id: 5,
  title: "Solana vs Avalanche",
  category: "Altcoins",
  author: "Nina Rousseau",
  authorInitial: "N",
  date: "7 juin 2025",
  readTime: "8 min",
  excerpt: "excerpt",
  gradient: "from-teal-950 via-teal-900 to-teal-700",
};

describe("ListCard", () => {
  it("shows the rank, category, title and date", () => {
    render(<ListCard article={article} index={2} />);

    expect(screen.getByRole("link").getAttribute("href")).toBe("/blog/5");
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("Solana vs Avalanche")).toBeTruthy();
    expect(screen.getByText(/8 min · 7 juin 2025/)).toBeTruthy();
  });
});
