import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

const nav = vi.hoisted(() => ({ id: "4", replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  useParams: () => ({ id: nav.id }),
}));

import RedactionPage from "../../../app/(app)/redaction/page";
import NewArticlePage from "../../../app/(app)/redaction/nouveau/page";
import EditArticlePage from "../../../app/(app)/redaction/[id]/page";
import TeamPage from "../../../app/(app)/redaction/equipe/page";
import { jsonResponse, makeDetail, renderWithAuth } from "../../lib/blogTestUtils";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  nav.id = "4";
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("editorial pages", () => {
  it("are closed to plain readers", () => {
    for (const Page of [RedactionPage, NewArticlePage, EditArticlePage, TeamPage]) {
      const { unmount } = renderWithAuth(<Page />, "user");
      expect(screen.getByRole("heading", { name: "Accès réservé" })).toBeTruthy();
      unmount();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("the team page is for admins only", () => {
    renderWithAuth(<TeamPage />, "editor");
    expect(screen.getByRole("heading", { name: "Accès réservé" })).toBeTruthy();
  });

  it("the new-article page opens an empty editor", () => {
    renderWithAuth(<NewArticlePage />, "editor");
    expect((screen.getByLabelText("Titre") as HTMLInputElement).value).toBe("");
  });

  it("the edit page loads the article, drafts included", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, makeDetail({ id: 4, title: "À reprendre", status: "draft" })));
    renderWithAuth(<EditArticlePage />, "editor");
    await vi.waitFor(() =>
      expect((screen.getByLabelText("Titre") as HTMLInputElement).value).toBe("À reprendre"),
    );
    expect(String(fetchMock.mock.calls[0][0])).toContain("/blog/manage/articles/4");
  });

  it("the edit page explains a missing article", async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { detail: "Article introuvable." }));
    renderWithAuth(<EditArticlePage />, "editor");
    expect((await screen.findByRole("alert")).textContent).toBe("Article introuvable.");
    expect(screen.getByRole("link", { name: "Retour à la rédaction" })).toBeTruthy();
  });

  it("the edit page rejects ids that aren't numbers", () => {
    nav.id = "abc";
    renderWithAuth(<EditArticlePage />, "editor");
    expect(screen.getByText("Article introuvable.")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
