import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import BlogPage, { metadata } from "../../../app/(public)/blog/page";
import { ARTICLES, CATEGORY_META } from "../../../app/(public)/blog/data";

const categories = Object.keys(CATEGORY_META);
const [featured, ...others] = ARTICLES;

describe("BlogPage", () => {
  it("keeps its SEO metadata", () => {
    expect(metadata.title).toBe("Blog – Analyses et actualités crypto");
  });

  it("renders the page heading and intro", () => {
    render(<BlogPage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Analyses et actualités crypto/,
      }),
    ).toBeTruthy();
    expect(screen.getByText(/Analyses, tutoriels et actualités/)).toBeTruthy();
  });

  it("shows the featured article with its excerpt, then four headlines", () => {
    render(<BlogPage />);
    const unes = screen.getByRole("region", { name: "À la une" });
    expect(
      within(unes).getByRole("heading", { name: featured.title }),
    ).toBeTruthy();
    expect(within(unes).getByText(featured.excerpt)).toBeTruthy();
    for (const a of others.slice(0, 4)) {
      expect(within(unes).getByText(a.title)).toBeTruthy();
    }
  });

  it("lists the remaining articles under « Derniers articles »", () => {
    render(<BlogPage />);
    expect(
      screen.getByRole("heading", { name: "Derniers articles" }),
    ).toBeTruthy();
    for (const a of others.slice(4)) {
      expect(screen.getByText(a.title)).toBeTruthy();
    }
  });

  it("links every article to its page", () => {
    render(<BlogPage />);
    expect(
      screen.getAllByRole("link").map((l) => l.getAttribute("href")),
    ).toEqual(expect.arrayContaining(ARTICLES.map((a) => `/blog/${a.id}`)));
  });

  it("offers « Tout » plus one filter per category", () => {
    render(<BlogPage />);
    const group = screen.getByRole("group", { name: "Filtrer par catégorie" });
    expect(within(group).getAllByRole("button")).toHaveLength(
      categories.length + 1,
    );
    expect(
      within(group)
        .getByRole("button", { name: "Tout" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("filters the articles by category", () => {
    render(<BlogPage />);
    fireEvent.click(screen.getByRole("button", { name: "NFT" }));

    const nft = ARTICLES.filter((a) => a.category === "NFT");
    expect(screen.getByRole("heading", { name: "NFT" })).toBeTruthy();
    expect(screen.getByText(String(nft.length))).toBeTruthy();
    for (const a of nft) expect(screen.getByText(a.title)).toBeTruthy();
    const other = ARTICLES.find((a) => a.category !== "NFT")!;
    expect(screen.queryByText(other.title)).toBeNull();
    expect(screen.queryByRole("region", { name: "À la une" })).toBeNull();
  });

  it("no longer shows the fake newsletter or « load more » controls", () => {
    render(<BlogPage />);
    expect(screen.queryByText(/S.abonner gratuitement/)).toBeNull();
    expect(screen.queryByText(/Charger plus/)).toBeNull();
  });
});
