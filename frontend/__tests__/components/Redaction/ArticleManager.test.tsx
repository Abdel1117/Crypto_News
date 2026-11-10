import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import ArticleManager from "@/app/components/Redaction/ArticleManager";
import { HeaderSlotsContext } from "@/app/components/AppShell/HeaderSlots";
import type { Role } from "@/app/lib/features/auth/authSlice";
import { jsonResponse, makeArticle, renderWithAuth } from "../../lib/blogTestUtils";

const PUBLISHED = makeArticle({ id: 1, slug: "en-ligne", title: "Article en ligne", like_count: 5 });
const DRAFT = makeArticle({ id: 2, title: "Brouillon en cours", status: "draft", published_at: null });

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("confirm", vi.fn(() => true));
  fetchMock.mockResolvedValue(jsonResponse(200, { items: [PUBLISHED, DRAFT], total: 2 }));
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

function renderManager(role: Role = "editor") {
  const actions = document.createElement("div");
  document.body.appendChild(actions);
  const result = renderWithAuth(
    <HeaderSlotsContext.Provider value={{ title: null, actions }}>
      <ArticleManager />
    </HeaderSlotsContext.Provider>,
    role,
  );
  return { ...result, actions };
}

describe("ArticleManager", () => {
  it("lists every article with its status", async () => {
    renderManager();
    const list = await screen.findByRole("list");
    expect(within(list).getByText("Article en ligne")).toBeTruthy();
    expect(within(list).getByText("Publié")).toBeTruthy();
    expect(within(list).getByText("Brouillon")).toBeTruthy();
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/blog\/manage\/articles$/);
  });

  it("links to the public page only when published, and to the editor", async () => {
    renderManager();
    await screen.findByText("Article en ligne");
    expect(screen.getByRole("link", { name: "Voir « Article en ligne »" }).getAttribute("href")).toBe(
      "/blog/en-ligne",
    );
    expect(screen.queryByRole("link", { name: "Voir « Brouillon en cours »" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Modifier « Brouillon en cours »" }).getAttribute("href"),
    ).toBe("/redaction/2");
  });

  it("filters by status through the API", async () => {
    renderManager();
    await screen.findByText("Article en ligne");
    fireEvent.click(screen.getByRole("button", { name: "Brouillons" }));
    await waitFor(() =>
      expect(String(fetchMock.mock.calls.at(-1)?.[0])).toContain("/blog/manage/articles?status=draft"),
    );
  });

  it("deletes an article after confirmation", async () => {
    renderManager();
    await screen.findByText("Article en ligne");
    fetchMock.mockResolvedValueOnce(jsonResponse(204, null));
    fireEvent.click(screen.getByRole("button", { name: "Supprimer « Article en ligne »" }));

    await waitFor(() => expect(screen.queryByText("Article en ligne")).toBeNull());
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/blog/manage/articles/1");
    expect(init.method).toBe("DELETE");
  });

  it("keeps the article when deletion is cancelled", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    renderManager();
    await screen.findByText("Article en ligne");
    fireEvent.click(screen.getByRole("button", { name: "Supprimer « Article en ligne »" }));
    expect(screen.getByText("Article en ligne")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("puts « Nouvel article » in the top bar; « Équipe » for admins only", async () => {
    const { actions } = renderManager("editor");
    await screen.findByText("Article en ligne");
    expect(within(actions).getByRole("link", { name: /Nouvel article/ }).getAttribute("href")).toBe(
      "/redaction/nouveau",
    );
    expect(within(actions).queryByRole("link", { name: /Équipe/ })).toBeNull();
  });

  it("admins get the team link", async () => {
    const { actions } = renderManager("admin");
    await screen.findByText("Article en ligne");
    expect(within(actions).getByRole("link", { name: /Équipe/ }).getAttribute("href")).toBe(
      "/redaction/equipe",
    );
  });

  it("shows an empty state and API errors", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { items: [], total: 0 }));
    renderManager();
    expect(await screen.findByText("Aucun article ici.")).toBeTruthy();

    fetchMock.mockResolvedValueOnce(jsonResponse(403, { detail: "Accès réservé à l'équipe éditoriale." }));
    fireEvent.click(screen.getByRole("button", { name: "Publiés" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Accès réservé à l'équipe éditoriale.");
  });
});
