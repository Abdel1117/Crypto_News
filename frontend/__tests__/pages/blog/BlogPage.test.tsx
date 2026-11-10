import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import BlogPage, { metadata } from "../../../app/(public)/blog/page";
import { CATEGORIES } from "../../../app/components/Blog/categories";
import type { ArticleSummary } from "../../../app/lib/api/blog";
import { jsonResponse, makeArticle, renderWithAuth } from "../../lib/blogTestUtils";
import type { Role } from "../../../app/lib/features/auth/authSlice";

const ARTICLES: ArticleSummary[] = [
  makeArticle({ id: 1, title: "Le Bitcoin en tête", excerpt: "À la une, avec un résumé." }),
  makeArticle({ id: 2, title: "Ethereum change", category: "Ethereum" }),
  makeArticle({ id: 3, title: "La DeFi revient", category: "DeFi" }),
  makeArticle({ id: 4, title: "NFT et jeux", category: "NFT" }),
  makeArticle({ id: 5, title: "Second NFT", category: "NFT" }),
  makeArticle({ id: 6, title: "Altcoins en vue", category: "Altcoins" }),
  makeArticle({ id: 7, title: "Analyse du marché", category: "Analyse" }),
];

const fetchMock = vi.fn();

/** The list request answers `articles`; the « Pour vous » one, `forYou`. */
function api(articles: ArticleSummary[], forYou: ArticleSummary[] = []) {
  fetchMock.mockImplementation(async (url: string) =>
    url.includes("/blog/recommendations")
      ? jsonResponse(200, forYou)
      : jsonResponse(200, { items: articles, total: articles.length }),
  );
}

async function renderPage(role: Role | null = null) {
  return renderWithAuth(await BlogPage(), role);
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  api(ARTICLES);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("BlogPage", () => {
  it("keeps its SEO metadata", () => {
    expect(metadata.title).toBe("Blog – Analyses et actualités crypto");
    expect(metadata.alternates?.canonical).toBe("/blog");
  });

  it("loads the published articles from the API", async () => {
    await renderPage();
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/blog/articles?limit=60");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ next: { revalidate: 60 } });
  });

  it("renders the page heading and intro", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: /Analyses et actualités crypto/ }),
    ).toBeTruthy();
    expect(screen.getByText(/Analyses, tutoriels et actualités/)).toBeTruthy();
  });

  it("shows the featured article with its excerpt, then four headlines", async () => {
    await renderPage();
    const unes = screen.getByRole("region", { name: "À la une" });
    expect(within(unes).getByRole("heading", { name: "Le Bitcoin en tête" })).toBeTruthy();
    expect(within(unes).getByText("À la une, avec un résumé.")).toBeTruthy();
    for (const a of ARTICLES.slice(1, 5)) {
      expect(within(unes).getByText(a.title)).toBeTruthy();
    }
  });

  it("lists the remaining articles under « Derniers articles »", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { name: "Derniers articles" })).toBeTruthy();
    for (const a of ARTICLES.slice(5)) expect(screen.getByText(a.title)).toBeTruthy();
  });

  it("links every article to its page by slug", async () => {
    await renderPage();
    const hrefs = screen.getAllByRole("link").map((l) => l.getAttribute("href"));
    expect(hrefs).toEqual(expect.arrayContaining(ARTICLES.map((a) => `/blog/${a.slug}`)));
  });

  it("offers « Tout » plus one filter per category", async () => {
    await renderPage();
    const group = screen.getByRole("group", { name: "Filtrer par catégorie" });
    expect(within(group).getAllByRole("button")).toHaveLength(CATEGORIES.length + 1);
    expect(
      within(group).getByRole("button", { name: "Tout" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("filters the articles by category", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "NFT" }));

    expect(screen.getByRole("heading", { name: "NFT" })).toBeTruthy();
    expect(screen.getByText("NFT et jeux")).toBeTruthy();
    expect(screen.getByText("Second NFT")).toBeTruthy();
    expect(screen.queryByText("Ethereum change")).toBeNull();
    expect(screen.queryByRole("region", { name: "À la une" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Web3" }));
    expect(screen.getByText(/Aucun article dans cette catégorie/)).toBeTruthy();
  });

  it("copes with a single article (no headlines, no latest section)", async () => {
    api([ARTICLES[0]]);
    await renderPage();
    expect(screen.getByRole("heading", { name: "Le Bitcoin en tête" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Derniers articles" })).toBeNull();
  });

  it("says so when nothing is published yet", async () => {
    api([]);
    await renderPage();
    expect(screen.getByText(/Aucun article publié pour le moment/)).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Filtrer par catégorie" })).toBeNull();
  });

  it("shows an error instead of crashing when the API is down", async () => {
    fetchMock.mockRejectedValue(new Error("down"));
    await renderPage();
    expect(screen.getByRole("alert").textContent).toMatch(/Impossible de charger/);
  });

  it("logged out: no reader shortcuts and no « Pour vous »", async () => {
    await renderPage();
    expect(screen.queryByRole("link", { name: /Mes favoris/ })).toBeNull();
    expect(screen.queryByRole("region", { name: "Pour vous" })).toBeNull();
  });

  it("logged in: favorites shortcut and personalized picks", async () => {
    api(ARTICLES, [makeArticle({ id: 42, title: "Choisi pour vous" })]);
    await renderPage("user");
    expect(screen.getByRole("link", { name: /Mes favoris/ }).getAttribute("href")).toBe(
      "/blog/favoris",
    );
    expect(screen.queryByRole("link", { name: /Rédaction/ })).toBeNull();
    const forYou = await screen.findByRole("region", { name: "Pour vous" });
    expect(within(forYou).getByText("Choisi pour vous")).toBeTruthy();
  });

  it("editors also get a link to the editors' desk", async () => {
    await renderPage("editor");
    expect(screen.getByRole("link", { name: /Rédaction/ }).getAttribute("href")).toBe(
      "/redaction",
    );
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([u]) => String(u).includes("recommendations"))).toBe(
        true,
      ),
    );
  });
});
