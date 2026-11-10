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

const NO_COVER = { cover_image: null, cover_alt: "" };
const KEY = "c".repeat(32);

describe("validateArticle", () => {
  it("mirrors the API rules", () => {
    expect(
      validateArticle({ title: "abc", excerpt: "court", body: "  ", category: "Poker", ...NO_COVER }),
    ).toEqual({
      title: expect.stringMatching(/au moins 5/),
      excerpt: expect.stringMatching(/au moins 10/),
      body: "L’article est vide.",
      category: "Choisissez une catégorie.",
    });
    expect(
      validateArticle({
        title: "Titre ok",
        excerpt: "Résumé correct.",
        body: "x",
        category: "NFT",
        ...NO_COVER,
      }),
    ).toEqual({});
  });

  it("asks for the image's text alternative", () => {
    const base = { title: "Titre ok", excerpt: "Résumé correct.", body: "x", category: "NFT" };
    expect(validateArticle({ ...base, cover_image: KEY, cover_alt: "  " })).toEqual({
      cover_alt: "Décrivez l’image en quelques mots.",
    });
    expect(validateArticle({ ...base, cover_image: KEY, cover_alt: "x".repeat(201) })).toEqual({
      cover_alt: "200 caractères au maximum.",
    });
    expect(validateArticle({ ...base, cover_image: KEY, cover_alt: "Un graphique" })).toEqual({});
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
      cover_image: null,
      cover_alt: null,
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

function imageFile(name = "photo.png", type = "image/png", size?: number) {
  const file = new File([new Uint8Array(16)], name, { type });
  if (size !== undefined) Object.defineProperty(file, "size", { value: size });
  return file;
}

function pick(file: File) {
  fireEvent.change(screen.getByLabelText("Fichier de l’image de couverture"), {
    target: { files: [file] },
  });
}

describe("ArticleEditor — cover image", () => {
  it("sends the image, asks for its description, then saves both", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { key: KEY }));
    renderWithAuth(<ArticleEditor />, "editor");
    fill(VALID, "Le texte.");
    pick(imageFile());

    const alt = await screen.findByLabelText("Texte alternatif");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/blog/manage/images");
    expect(init.method).toBe("POST");
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
    expect(init.headers["Content-Type"]).toBeUndefined();
    expect(document.activeElement).toBe(alt);
    expect(document.querySelector("img")?.getAttribute("src")).toContain(`/media/blog/${KEY}.webp`);

    fireEvent.click(screen.getByRole("button", { name: "Publier" }));
    expect(screen.getByText("Décrivez l’image en quelques mots.")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockResolvedValueOnce(jsonResponse(201, makeDetail({ id: 14 })));
    fireEvent.change(alt, { target: { value: "  Un graphique en hausse " } });
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/redaction/14"));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
      cover_image: KEY,
      cover_alt: "Un graphique en hausse",
    });
  });

  it("checks the type and weight before sending anything", () => {
    renderWithAuth(<ArticleEditor />, "editor");
    pick(imageFile("anim.gif", "image/gif"));
    expect(screen.getByRole("alert").textContent).toMatch(/JPEG, PNG ou WebP/);

    pick(imageFile("photo.jpg", "image/jpeg", 5 * 1024 * 1024 + 1));
    expect(screen.getByRole("alert").textContent).toBe("Image trop lourde : 5 Mo au maximum.");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Texte alternatif")).toBeNull();
  });

  it("shows the API's refusal of an image", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(422, { detail: "Ce fichier n’est pas une image JPEG, PNG ou WebP valide." }),
    );
    renderWithAuth(<ArticleEditor />, "editor");
    pick(imageFile());
    expect((await screen.findByRole("alert")).textContent).toMatch(/pas une image/);
    expect(screen.queryByLabelText("Texte alternatif")).toBeNull();
  });

  it("can't save while the image is being sent", () => {
    fetchMock.mockReturnValueOnce(new Promise(() => {}));
    renderWithAuth(<ArticleEditor />, "editor");
    pick(imageFile());
    expect(screen.getByText("Envoi de l’image…")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Publier" }) as HTMLButtonElement).disabled).toBe(true);
  });

  const ILLUSTRATED = makeDetail({ id: 6, cover_image: KEY, cover_alt: "Un graphique" });

  it("edits the text alternative of the current image", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ...ILLUSTRATED, cover_alt: "Autre texte" }));
    renderWithAuth(<ArticleEditor article={ILLUSTRATED} />, "admin");
    const alt = screen.getByLabelText("Texte alternatif") as HTMLInputElement;
    expect(alt.value).toBe("Un graphique");

    fireEvent.change(alt, { target: { value: "Autre texte" } });
    expect(screen.getByText("Modifications non enregistrées")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await screen.findByRole("status");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      cover_image: KEY,
      cover_alt: "Autre texte",
    });
  });

  it("removes the image", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { ...ILLUSTRATED, cover_image: null, cover_alt: null }),
    );
    renderWithAuth(<ArticleEditor article={ILLUSTRATED} />, "admin");
    fireEvent.click(screen.getByRole("button", { name: "Retirer" }));
    expect(screen.queryByLabelText("Texte alternatif")).toBeNull();
    expect(screen.getByText("Aucune image")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await screen.findByRole("status");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      cover_image: null,
      cover_alt: null,
    });
  });

  it("shows the image in the preview", () => {
    renderWithAuth(<ArticleEditor article={ILLUSTRATED} />, "admin");
    fireEvent.click(screen.getByRole("button", { name: "Aperçu" }));
    const preview = screen.getByLabelText("Aperçu de l’article");
    expect(preview.querySelector("img")?.getAttribute("alt")).toBe("Un graphique");
  });
});
