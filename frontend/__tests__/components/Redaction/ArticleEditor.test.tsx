import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

import ArticleEditor, { validateArticle } from "@/app/components/Redaction/ArticleEditor";
import { jsonResponse, makeDetail, renderWithAuth } from "../../lib/blogTestUtils";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  replace.mockReset();
  vi.unstubAllGlobals();
});

function fill(fields: Partial<Record<"Titre" | "Résumé" | "Catégorie", string>>, body?: string) {
  for (const [label, value] of Object.entries(fields)) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  if (body !== undefined) {
    fireEvent.change(screen.getByRole("textbox", { name: "Contenu" }), { target: { value: body } });
  }
}

const VALID = { Titre: "Un titre valable", Résumé: "Un résumé assez long.", Catégorie: "DeFi" };

describe("validateArticle", () => {
  it("mirrors the API rules", () => {
    expect(
      validateArticle({ title: "abc", excerpt: "court", body: "  ", category: "Poker" }),
    ).toEqual({
      title: expect.stringMatching(/au moins 5/),
      excerpt: expect.stringMatching(/au moins 10/),
      body: "L’article est vide.",
      category: "Choisissez une catégorie.",
    });
    expect(
      validateArticle({ title: "Titre ok", excerpt: "Résumé correct.", body: "x", category: "NFT" }),
    ).toEqual({});
  });
});

describe("ArticleEditor — new article", () => {
  it("shows what is missing instead of sending", () => {
    renderWithAuth(<ArticleEditor />, "editor");
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));

    expect(screen.getByText(/Le titre doit faire au moins/)).toBeTruthy();
    expect(screen.getByText("Choisissez une catégorie.")).toBeTruthy();
    expect(screen.getByLabelText("Titre").getAttribute("aria-invalid")).toBe("true");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("previews the Markdown like the published page", () => {
    renderWithAuth(<ArticleEditor />, "editor");
    fill(VALID, "## Section\n\nDu **gras**.");
    fireEvent.click(screen.getByRole("button", { name: "Aperçu" }));

    expect(screen.getByRole("heading", { level: 2, name: "Un titre valable" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Section" })).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Contenu" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Écrire" }));
    expect(screen.getByRole("textbox", { name: "Contenu" })).toBeTruthy();
  });

  it("saves a draft, then opens it for editing", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, makeDetail({ id: 12, status: "draft" })));
    renderWithAuth(<ArticleEditor />, "editor");
    fill(VALID, "Le texte.");
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le brouillon" }));

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/redaction/12"));
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/blog/manage/articles");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      title: "Un titre valable",
      excerpt: "Un résumé assez long.",
      body: "Le texte.",
      category: "DeFi",
      status: "draft",
    });
  });

  it("publishes directly", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, makeDetail({ id: 13 })));
    renderWithAuth(<ArticleEditor />, "editor");
    fill(VALID, "Le texte.");
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/redaction/13"));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).status).toBe("published");
  });

  it("shows the API's refusal", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(403, { detail: "Accès réservé à l'équipe éditoriale." }));
    renderWithAuth(<ArticleEditor />, "editor");
    fill(VALID, "Le texte.");
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Accès réservé à l'équipe éditoriale.");
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("ArticleEditor — existing article", () => {
  const PUBLISHED = makeDetail({
    id: 4,
    slug: "deja-en-ligne",
    title: "Déjà en ligne",
    excerpt: "Un résumé déjà là.",
    category: "NFT",
    body: "Ancien texte.",
  });

  it("starts from the article and flags unsaved changes", () => {
    renderWithAuth(<ArticleEditor article={PUBLISHED} />, "admin");
    expect((screen.getByLabelText("Titre") as HTMLInputElement).value).toBe("Déjà en ligne");
    expect(screen.getByRole("link", { name: /Voir l’article/ }).getAttribute("href")).toBe(
      "/blog/deja-en-ligne",
    );
    expect(screen.queryByText("Modifications non enregistrées")).toBeNull();

    fill({}, "Nouveau texte.");
    expect(screen.getByText("Modifications non enregistrées")).toBeTruthy();
  });

  it("saves changes with PATCH", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ...PUBLISHED, body: "Nouveau texte." }));
    renderWithAuth(<ArticleEditor article={PUBLISHED} />, "admin");
    fill({}, "Nouveau texte.");
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect((await screen.findByRole("status")).textContent).toBe("Modifications enregistrées.");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/blog/manage/articles/4");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body).status).toBe("published");
    expect(screen.queryByText("Modifications non enregistrées")).toBeNull();
  });

  it("unpublishes, then can publish again", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ...PUBLISHED, status: "draft" }));
    renderWithAuth(<ArticleEditor article={PUBLISHED} />, "admin");
    fireEvent.click(screen.getByRole("button", { name: "Dépublier" }));

    expect((await screen.findByRole("status")).textContent).toMatch(/Article dépublié/);
    expect(screen.getByText("Brouillon")).toBeTruthy();

    fetchMock.mockResolvedValueOnce(jsonResponse(200, PUBLISHED));
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));
    expect((await screen.findByRole("status")).textContent).toBe("Article publié.");
  });

  it("asks before leaving with unsaved changes", () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);
    renderWithAuth(<ArticleEditor article={PUBLISHED} />, "admin");
    fill({}, "Nouveau texte.");

    fireEvent.click(screen.getByRole("link", { name: "Annuler" }));
    expect(confirm).toHaveBeenCalledWith("Quitter sans enregistrer ?");
  });

  it("warns the browser before unloading with unsaved changes", () => {
    renderWithAuth(<ArticleEditor article={PUBLISHED} />, "admin");
    fill({}, "Nouveau texte.");
    const event = new Event("beforeunload", { cancelable: true });
    globalThis.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
