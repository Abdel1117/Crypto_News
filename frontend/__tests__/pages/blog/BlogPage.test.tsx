import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ARTICLES, CATEGORY_META } from "../../../app/(public)/blog/data";
import type { Article } from "../../../app/(public)/blog/data";

// ─── Helpers (mirror the page's own derived state) ────────────────────────────

const [featured, ...rest] = ARTICLES;
const heroGrid = rest.slice(0, 4);
const defiArticles = ARTICLES.filter(
  (a) => a.category === "DeFi" || a.category === "Ethereum",
);
const defiFeatured = defiArticles[0];
const defiList = defiArticles.slice(1, 6);
const nftArticles = ARTICLES.filter((a) => a.category === "NFT").slice(0, 3);
const analyseArticles = ARTICLES.filter((a) => a.category === "Analyse").slice(0, 3);
const bitcoinFeatured = ARTICLES.find(
  (a) => a.category === "Bitcoin" && a.id !== 1,
)!;
const bitcoinList = ARTICLES.filter(
  (a) => a.category !== "DeFi" && a.category !== "NFT" && a.id !== bitcoinFeatured?.id,
).slice(0, 5);
const latest = ARTICLES.slice(6, 14);

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.PropsWithChildren<{ href: string; className?: string }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/ui/HeroCard/HeroCard", () => ({
  HeroCard: ({
    article,
    className,
  }: {
    article: Article;
    className?: string;
  }) => (
    <article data-testid="hero-card" data-id={article.id} className={className}>
      {article.title}
    </article>
  ),
}));

vi.mock("@/app/ui/SmallCard/SmallCard", () => ({
  SmallCard: ({ article }: { article: Article }) => (
    <article data-testid="small-card" data-id={article.id}>
      {article.title}
    </article>
  ),
}));

vi.mock("@/app/ui/ListCard/ListCard", () => ({
  ListCard: ({ article, index }: { article: Article; index: number }) => (
    <article data-testid="list-card" data-id={article.id} data-index={index}>
      {article.title}
    </article>
  ),
}));

vi.mock("@/app/ui/GridCard/GridCard", () => ({
  GridCard: ({ article }: { article: Article }) => (
    <article data-testid="grid-card" data-id={article.id}>
      {article.title}
    </article>
  ),
}));

vi.mock("@/app/ui/SectionHeader/SectionHeader", () => ({
  SectionHeader: ({ title, href }: { title: string; href?: string }) => (
    <h2 data-testid="section-header" data-href={href}>
      {title}
    </h2>
  ),
}));

vi.mock("@/app/ui/CategoryBadge/CategoryBadge", () => ({
  CategoryBadge: ({ category }: { category: string }) => (
    <span data-testid="category-badge">{category}</span>
  ),
}));

vi.mock("@/app/ui/AuthorChip/AuthorChip", () => ({
  AuthorChip: ({
    name,
    readTime,
  }: {
    initial: string;
    name: string;
    date: string;
    readTime: string;
  }) => (
    <span data-testid="author-chip">
      {name} · {readTime}
    </span>
  ),
}));

import BlogPage from "../../../app/(public)/blog/page";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("BlogPage", () => {
  describe("page header", () => {
    it("renders the h1 heading", () => {
      render(<BlogPage />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeTruthy();
      expect(heading.textContent).toContain("Blog");
      expect(heading.textContent).toContain("Crypto");
    });

    it("renders the page description", () => {
      render(<BlogPage />);
      expect(
        screen.getByText(
          "Analyses, tutoriels et news sur Bitcoin, Ethereum, DeFi et le Web3.",
        ),
      ).toBeTruthy();
    });
  });

  describe("hero grid", () => {
    it("renders 5 hero cards in total (1 featured + 4 grid)", () => {
      render(<BlogPage />);
      expect(screen.getAllByTestId("hero-card").length).toBe(5);
    });

    it("renders the featured article (ARTICLES[0]) as the first hero card", () => {
      render(<BlogPage />);
      const cards = screen.getAllByTestId("hero-card");
      expect(cards[0].getAttribute("data-id")).toBe(String(featured.id));
      expect(cards[0].textContent).toContain(featured.title);
    });

    it("renders the 4 grid articles after the featured card", () => {
      render(<BlogPage />);
      const cards = screen.getAllByTestId("hero-card");
      heroGrid.forEach((article, i) => {
        expect(cards[i + 1].getAttribute("data-id")).toBe(String(article.id));
      });
    });
  });

  describe("category pills", () => {
    it("renders the 'Tout' button", () => {
      render(<BlogPage />);
      expect(screen.getByRole("button", { name: "Tout" })).toBeTruthy();
    });

    it("renders a button for each category in CATEGORY_META", () => {
      render(<BlogPage />);
      Object.keys(CATEGORY_META).forEach((cat) => {
        expect(screen.getByRole("button", { name: cat })).toBeTruthy();
      });
    });

    it(`renders ${Object.keys(CATEGORY_META).length + 1} category buttons total`, () => {
      render(<BlogPage />);
      // All category buttons + "Tout" + "Charger plus d'articles" — filter to visible pill zone
      const allButtons = screen.getAllByRole("button");
      const categoryButtons = allButtons.filter(
        (btn) =>
          btn.textContent === "Tout" ||
          Object.keys(CATEGORY_META).includes(btn.textContent ?? ""),
      );
      expect(categoryButtons.length).toBe(Object.keys(CATEGORY_META).length + 1);
    });
  });

  describe("DeFi & Ethereum section", () => {
    it("renders the section header", () => {
      render(<BlogPage />);
      expect(screen.getByText("DeFi & Ethereum")).toBeTruthy();
    });

    it("renders the featured DeFi article title in an h3", () => {
      render(<BlogPage />);
      expect(screen.getByRole("heading", { level: 3, name: defiFeatured.title })).toBeTruthy();
    });

    it("renders the featured DeFi article excerpt", () => {
      render(<BlogPage />);
      expect(screen.getByText(defiFeatured.excerpt)).toBeTruthy();
    });

    it("renders the featured DeFi article category badge", () => {
      render(<BlogPage />);
      const badges = screen.getAllByTestId("category-badge");
      expect(badges.some((b) => b.textContent === defiFeatured.category)).toBeTruthy();
    });

    it("renders the featured DeFi article author chip", () => {
      render(<BlogPage />);
      const chips = screen.getAllByTestId("author-chip");
      expect(chips.some((c) => c.textContent?.includes(defiFeatured.author))).toBeTruthy();
    });

    it(`renders the featured DeFi card linked to /blog/${defiFeatured.id}`, () => {
      render(<BlogPage />);
      const link = screen.getByRole("link", { name: new RegExp(defiFeatured.title, "i") });
      expect(link.getAttribute("href")).toBe(`/blog/${defiFeatured.id}`);
    });

    it(`renders ${defiList.length} list cards in the DeFi section`, () => {
      render(<BlogPage />);
      // Total list cards = defiList + bitcoinList
      const allListCards = screen.getAllByTestId("list-card");
      expect(allListCards.length).toBe(defiList.length + bitcoinList.length);
    });

    it("renders the 'Voir tous les articles DeFi' link", () => {
      render(<BlogPage />);
      expect(screen.getByText("Voir tous les articles DeFi →")).toBeTruthy();
    });
  });

  describe("two-column sections (NFT & Analyse)", () => {
    it("renders the NFT & Collectibles section header", () => {
      render(<BlogPage />);
      expect(screen.getByText("NFT & Collectibles")).toBeTruthy();
    });

    it("renders the Analyse de marché section header", () => {
      render(<BlogPage />);
      expect(screen.getByText("Analyse de marché")).toBeTruthy();
    });

    it(`renders ${nftArticles.length + analyseArticles.length} grid cards total`, () => {
      render(<BlogPage />);
      expect(screen.getAllByTestId("grid-card").length).toBe(
        nftArticles.length + analyseArticles.length,
      );
    });

    it("renders each NFT article as a grid card", () => {
      render(<BlogPage />);
      const gridCards = screen.getAllByTestId("grid-card");
      const gridIds = gridCards.map((c) => c.getAttribute("data-id"));
      nftArticles.forEach((a) => {
        expect(gridIds).toContain(String(a.id));
      });
    });

    it("renders each Analyse article as a grid card", () => {
      render(<BlogPage />);
      const gridCards = screen.getAllByTestId("grid-card");
      const gridIds = gridCards.map((c) => c.getAttribute("data-id"));
      analyseArticles.forEach((a) => {
        expect(gridIds).toContain(String(a.id));
      });
    });
  });

  describe("Bitcoin & Altcoins section", () => {
    it("renders the section header", () => {
      render(<BlogPage />);
      expect(screen.getByText("Bitcoin & Altcoins")).toBeTruthy();
    });

    it("renders the featured Bitcoin article title in an h3", () => {
      render(<BlogPage />);
      expect(screen.getByRole("heading", { level: 3, name: bitcoinFeatured.title })).toBeTruthy();
    });

    it(`renders the featured Bitcoin card linked to /blog/${bitcoinFeatured.id}`, () => {
      render(<BlogPage />);
      const link = screen.getByRole("link", { name: new RegExp(bitcoinFeatured.title, "i") });
      expect(link.getAttribute("href")).toBe(`/blog/${bitcoinFeatured.id}`);
    });

    it("renders the Bitcoin featured article author chip", () => {
      render(<BlogPage />);
      const chips = screen.getAllByTestId("author-chip");
      expect(chips.some((c) => c.textContent?.includes(bitcoinFeatured.author))).toBeTruthy();
    });
  });

  describe("newsletter banner", () => {
    it("renders the Newsletter label", () => {
      render(<BlogPage />);
      expect(screen.getByText("Newsletter")).toBeTruthy();
    });

    it("renders the newsletter headline", () => {
      render(<BlogPage />);
      expect(screen.getByText("Ne manquez aucune actualité crypto")).toBeTruthy();
    });

    it("renders the subscribe CTA link pointing to #contact", () => {
      render(<BlogPage />);
      const link = screen.getByRole("link", { name: /abonner gratuitement/i });
      expect(link.getAttribute("href")).toBe("#contact");
    });
  });

  describe("latest articles section", () => {
    it("renders the 'Derniers articles' section header", () => {
      render(<BlogPage />);
      expect(screen.getByText("Derniers articles")).toBeTruthy();
    });

    it(`renders ${latest.length} small cards`, () => {
      render(<BlogPage />);
      expect(screen.getAllByTestId("small-card").length).toBe(latest.length);
    });

    it("renders each latest article as a small card with correct id", () => {
      render(<BlogPage />);
      const cards = screen.getAllByTestId("small-card");
      const renderedIds = cards.map((c) => c.getAttribute("data-id"));
      latest.forEach((a) => {
        expect(renderedIds).toContain(String(a.id));
      });
    });

    it("renders the 'Charger plus d'articles' button", () => {
      render(<BlogPage />);
      expect(
        screen.getByRole("button", { name: /charger plus/i }),
      ).toBeTruthy();
    });
  });

  describe("section headers count", () => {
    it("renders exactly 5 section headers", () => {
      render(<BlogPage />);
      // DeFi & Ethereum, NFT & Collectibles, Analyse de marché, Bitcoin & Altcoins, Derniers articles
      expect(screen.getAllByTestId("section-header").length).toBe(5);
    });
  });
});
