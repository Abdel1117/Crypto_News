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
import type { Article } from "../../app/(public)/blog/data";

const article: Article = {
  id: 3,
  title: "DeFi yields",
  category: "DeFi",
  author: "Sophie Martin",
  authorInitial: "S",
  date: "9 juin 2025",
  readTime: "6 min",
  excerpt: "excerpt",
  gradient: "from-purple-950 via-purple-900 to-purple-700",
};

describe("SmallCard", () => {
  it("links to the article page and shows its metadata", () => {
    render(<SmallCard article={article} />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/blog/3");
    expect(screen.getByText("DeFi yields")).toBeTruthy();
    expect(screen.getByText("Sophie Martin")).toBeTruthy();
    expect(screen.getByText("6 min")).toBeTruthy();
    expect(screen.getByText("S")).toBeTruthy();
    expect(screen.getByText("DeFi")).toBeTruthy();
  });
});
