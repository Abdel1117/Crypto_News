import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import Comments from "@/app/components/Blog/Comments";
import type { Role } from "@/app/lib/features/auth/authSlice";
import { jsonResponse, makeComment, renderWithAuth } from "../../lib/blogTestUtils";

const MINE = makeComment({ id: 1, user_id: 7, author_name: "Moi Même", body: "Mon avis" });
const THEIRS = makeComment({ id: 2, user_id: 9, author_name: "Rémi Lecteur", body: "Le sien" });

const fetchMock = vi.fn();

function page(items = [MINE, THEIRS], total = items.length) {
  return jsonResponse(200, { items, total });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("confirm", vi.fn(() => true));
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

async function renderComments(role: Role | null = "user") {
  const result = renderWithAuth(<Comments articleId={3} slug="mon-article" />, role);
  await screen.findByText("Mon avis");
  return result;
}

describe("Comments", () => {
  beforeEach(() => {
    fetchMock.mockResolvedValueOnce(page());
  });

  it("lists the comments with their count", async () => {
    await renderComments();
    expect(screen.getByText("Le sien")).toBeTruthy();
    const heading = screen.getByRole("heading", { name: /Commentaires/ });
    expect(within(heading).getByText("2")).toBeTruthy();
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/blog/articles/3/comments?limit=20&offset=0",
    );
  });

  it("logged out: invites to log in instead of showing the form", async () => {
    await renderComments(null);
    expect(screen.queryByLabelText("Votre commentaire")).toBeNull();
    expect(screen.getByRole("link", { name: "Connectez-vous" }).getAttribute("href")).toBe(
      "/login?next=%2Fblog%2Fmon-article",
    );
    expect(screen.queryByRole("button", { name: /Supprimer/ })).toBeNull();
  });

  it("posts a comment and shows it first", async () => {
    await renderComments();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(201, makeComment({ id: 5, user_id: 7, body: "Nouveau !" })),
    );
    const publish = screen.getByRole("button", { name: "Publier" }) as HTMLButtonElement;
    expect(publish.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Votre commentaire"), {
      target: { value: "  Nouveau !  " },
    });
    fireEvent.click(publish);

    expect(await screen.findByText("Nouveau !")).toBeTruthy();
    const [url, init] = fetchMock.mock.calls[1];
    expect(String(url)).toContain("/blog/articles/3/comments");
    expect(JSON.parse(init.body)).toEqual({ body: "Nouveau !" });
    expect((screen.getByLabelText("Votre commentaire") as HTMLTextAreaElement).value).toBe("");
  });

  it("keeps the text when posting fails", async () => {
    await renderComments();
    fetchMock.mockResolvedValueOnce(jsonResponse(422, { detail: "Trop long." }));
    fireEvent.change(screen.getByLabelText("Votre commentaire"), { target: { value: "Texte" } });
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Trop long.");
    expect((screen.getByLabelText("Votre commentaire") as HTMLTextAreaElement).value).toBe("Texte");
  });

  it("readers delete only their own comments", async () => {
    await renderComments("user");
    expect(screen.getByRole("button", { name: "Supprimer le commentaire de Moi Même" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Supprimer le commentaire de Rémi Lecteur" })).toBeNull();
  });

  it("editors can delete any comment", async () => {
    await renderComments("editor");
    fetchMock.mockResolvedValueOnce(jsonResponse(204, null));
    fireEvent.click(screen.getByRole("button", { name: "Supprimer le commentaire de Rémi Lecteur" }));

    await waitFor(() => expect(screen.queryByText("Le sien")).toBeNull());
    const [url, init] = fetchMock.mock.calls[1];
    expect(String(url)).toContain("/blog/comments/2");
    expect(init.method).toBe("DELETE");
  });

  it("asks before deleting", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    await renderComments("user");
    fireEvent.click(screen.getByRole("button", { name: "Supprimer le commentaire de Moi Même" }));
    expect(screen.getByText("Mon avis")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("Comments paging and errors", () => {
  it("loads more, without repeating a comment already shown", async () => {
    fetchMock.mockResolvedValueOnce(page([MINE], 3));
    renderWithAuth(<Comments articleId={3} slug="mon-article" />);
    await screen.findByText("Mon avis");

    fetchMock.mockResolvedValueOnce(page([MINE, THEIRS], 3));
    fireEvent.click(screen.getByRole("button", { name: "Charger plus" }));

    expect(await screen.findByText("Le sien")).toBeTruthy();
    expect(screen.getAllByText("Mon avis")).toHaveLength(1);
    expect(String(fetchMock.mock.calls[1][0])).toContain("offset=1");
  });

  it("invites the first comment when there is none", async () => {
    fetchMock.mockResolvedValueOnce(page([], 0));
    renderWithAuth(<Comments articleId={3} slug="mon-article" />);
    expect(await screen.findByText(/Soyez le premier/)).toBeTruthy();
  });

  it("says when the comments can't be loaded", async () => {
    fetchMock.mockRejectedValueOnce(new Error("down"));
    renderWithAuth(<Comments articleId={3} slug="mon-article" />);
    expect((await screen.findByRole("alert")).textContent).toMatch(/Impossible de charger/);
  });
});
