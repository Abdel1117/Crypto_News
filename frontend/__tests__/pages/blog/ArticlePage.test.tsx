import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

import ArticlePage, { generateMetadata } from "../../../app/(public)/blog/[slug]/page";
import {
  jsonResponse,
  makeArticle,
  makeComment,
  makeDetail,
  renderWithAuth,
} from "../../lib/blogTestUtils";

const ARTICLE = makeDetail({
  id: 3,
  slug: "bitcoin-et-les-etf",
  title: "Bitcoin et les ETF",
  excerpt: "Ce que changent les ETF spot.",
  category: "Bitcoin",
  author_name: "Élise Éditrice",
  read_minutes: 6,
  like_count: 4,
  published_at: "2026-11-02T09:00:00Z",
  body: "## Pourquoi\n\nDu **gras**, un [lien](https://example.com) et <script>alert(1)</script>.",
});
const RELATED = [makeArticle({ id: 8, slug: "suite", title: "La suite logique" })];

const fetchMock = vi.fn();

function api({ article = ARTICLE as typeof ARTICLE | null, related = RELATED } = {}) {
  fetchMock.mockImplementation(async (url: string) => {
    if (url.includes("/related")) return jsonResponse(200, related);
    if (url.includes("/comments")) {
      return jsonResponse(200, { items: [makeComment()], total: 1 });
    }
    if (url.endsWith("/me")) {
      return jsonResponse(200, { liked: true, favorited: false, like_count: 4 });
    }
    return article ? jsonResponse(200, article) : jsonResponse(404, { detail: "Article introuvable." });
  });
}

const params = (slug = ARTICLE.slug) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  api();
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("ArticlePage metadata", () => {
  it("describes the article for search engines and sharing", async () => {
    const meta = await generateMetadata(params());
    expect(meta.title).toBe("Bitcoin et les ETF");
    expect(meta.description).toBe("Ce que changent les ETF spot.");
    expect(meta.alternates?.canonical).toBe("/blog/bitcoin-et-les-etf");
    expect(meta.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-11-02T09:00:00Z",
      section: "Bitcoin",
    });
  });

  it("shares the cover image, or else the site's image", async () => {
    api({ article: { ...ARTICLE, cover_image: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", cover_alt: "Un graphique" } });
    const meta = await generateMetadata(params());
    const shared = [{ url: expect.stringContaining("/media/blog/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp"), alt: "Un graphique" }];
    expect(meta.openGraph?.images).toEqual(shared);
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", images: shared });

    api();
    const plain = await generateMetadata(params());
    expect(plain.openGraph?.images).toEqual([expect.objectContaining({ url: "/images/01.png" })]);
  });

  it("has a plain title for a missing article", async () => {
    api({ article: null });
    expect((await generateMetadata(params("nope"))).title).toBe("Article introuvable");
  });
});

describe("ArticlePage", () => {
  it("is a 404 when the article doesn't exist or isn't published", async () => {
    api({ article: null });
    await expect(ArticlePage(params("brouillon"))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the cover, the author and the Markdown body", async () => {
    renderWithAuth(await ArticlePage(params()));
    expect(screen.getByRole("heading", { level: 1, name: "Bitcoin et les ETF" })).toBeTruthy();
    expect(screen.getByText("Élise Éditrice")).toBeTruthy();
    expect(screen.getByText("6 min de lecture")).toBeTruthy();
    expect(screen.getByText("2 novembre 2026")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Pourquoi" })).toBeTruthy();
    expect(screen.getByText("gras").tagName).toBe("STRONG");
  });

  it("shows the cover image with its text alternative", async () => {
    api({ article: { ...ARTICLE, cover_image: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", cover_alt: "Un graphique" } });
    const { container } = renderWithAuth(await ArticlePage(params()));
    const img = screen.getByRole("img", { name: "Un graphique" });
    expect(img.getAttribute("src")).toContain("/media/blog/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp");
    expect(img.getAttribute("loading")).toBe("eager");
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.innerHTML);
    expect(ld.image).toContain("/media/blog/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp");
  });

  it("keeps the category gradient without an image", async () => {
    renderWithAuth(await ArticlePage(params()));
    expect(screen.queryByRole("img", { name: /./ })).toBeNull();
  });

  it("never renders raw HTML from the body", async () => {
    const { container } = renderWithAuth(await ArticlePage(params()));
    const scripts = [...container.querySelectorAll("script")];
    expect(scripts.every((s) => s.type === "application/ld+json")).toBe(true);
  });

  it("opens external links in a new tab without passing referrer or rank", async () => {
    renderWithAuth(await ArticlePage(params()));
    const link = screen.getByRole("link", { name: "lien" });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer nofollow");
  });

  it("adds BlogPosting structured data", async () => {
    const { container } = renderWithAuth(await ArticlePage(params()));
    const ld = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(ld?.innerHTML ?? "{}");
    expect(data).toMatchObject({
      "@type": "BlogPosting",
      headline: "Bitcoin et les ETF",
      author: { name: "Élise Éditrice" },
    });
  });

  it("suggests related articles", async () => {
    renderWithAuth(await ArticlePage(params()));
    const related = screen.getByRole("region", { name: "À lire ensuite" });
    expect(within(related).getByText("La suite logique")).toBeTruthy();
    expect(String(fetchMock.mock.calls.find(([u]) => String(u).includes("related"))?.[0])).toContain(
      "/blog/articles/3/related?limit=3",
    );
  });

  it("still renders when the related articles fail to load", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/related")) throw new Error("down");
      if (url.includes("/comments")) return jsonResponse(200, { items: [], total: 0 });
      return jsonResponse(200, ARTICLE);
    });
    renderWithAuth(await ArticlePage(params()));
    expect(screen.queryByRole("region", { name: "À lire ensuite" })).toBeNull();
  });

  it("logged out: like and favorite lead to the login page and back", async () => {
    renderWithAuth(await ArticlePage(params()));
    const back = "/login?next=%2Fblog%2Fbitcoin-et-les-etf";
    expect(screen.getByRole("link", { name: /4 J’aime/ }).getAttribute("href")).toBe(back);
    expect(screen.getByRole("link", { name: /Ajouter aux favoris/ }).getAttribute("href")).toBe(
      back,
    );
  });

  it("logged in: shows the reader's own like", async () => {
    renderWithAuth(await ArticlePage(params()), "user");
    const like = await screen.findByRole("button", { name: /4 J’aime/ });
    await vi.waitFor(() => expect(like.getAttribute("aria-pressed")).toBe("true"));
  });

  it("loads the comments", async () => {
    renderWithAuth(await ArticlePage(params()));
    expect(await screen.findByText("Très clair, merci !")).toBeTruthy();
  });
});
