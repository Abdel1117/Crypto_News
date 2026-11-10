import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import ArticleActions from "@/app/components/Blog/ArticleActions";
import { jsonResponse, renderWithAuth } from "../../lib/blogTestUtils";

const fetchMock = vi.fn();
const writeText = vi.fn();

function mine(liked = false, favorited = false, like_count = 3) {
  return jsonResponse(200, { liked, favorited, like_count });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});

afterEach(() => {
  fetchMock.mockReset();
  writeText.mockReset();
  vi.unstubAllGlobals();
});

function renderActions(loggedIn = true) {
  return renderWithAuth(
    <ArticleActions articleId={3} slug="mon-article" likeCount={3} />,
    loggedIn ? "user" : null,
  );
}

describe("ArticleActions", () => {
  it("logged out: links to the login page, then back to the article", () => {
    renderActions(false);
    const back = "/login?next=%2Fblog%2Fmon-article";
    expect(screen.getByRole("link", { name: /3 J’aime/ }).getAttribute("href")).toBe(back);
    expect(screen.getByRole("link", { name: /Ajouter aux favoris/ }).getAttribute("href")).toBe(back);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("logged in: loads the reader's own like and favorite", async () => {
    fetchMock.mockResolvedValue(mine(true, true, 3));
    renderActions();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Dans mes favoris/ })).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: /3 J’aime/ }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(String(fetchMock.mock.calls[0][0])).toContain("/blog/articles/3/me");
  });

  it("likes at once, then takes the server's count", async () => {
    fetchMock.mockResolvedValueOnce(mine()).mockResolvedValueOnce(mine(true, false, 10));
    renderActions();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /3 J’aime/ }));
    expect(screen.getByRole("button", { name: /4 J’aime/ }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(await screen.findByRole("button", { name: /10 J’aime/ })).toBeTruthy();

    const [url, init] = fetchMock.mock.calls[1];
    expect(String(url)).toContain("/blog/articles/3/like");
    expect(init.method).toBe("PUT");
  });

  it("undoes the like and explains when the server refuses", async () => {
    fetchMock
      .mockResolvedValueOnce(mine())
      .mockResolvedValueOnce(jsonResponse(404, { detail: "Article introuvable." }));
    renderActions();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /3 J’aime/ }));
    expect((await screen.findByRole("alert")).textContent).toBe("Article introuvable.");
    expect(screen.getByRole("button", { name: /3 J’aime/ }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("removes a favorite with DELETE", async () => {
    fetchMock.mockResolvedValueOnce(mine(false, true)).mockResolvedValueOnce(mine(false, false));
    renderActions();
    const saved = await screen.findByRole("button", { name: /Dans mes favoris/ });

    fireEvent.click(saved);
    expect(await screen.findByRole("button", { name: /Ajouter aux favoris/ })).toBeTruthy();
    const [url, init] = fetchMock.mock.calls[1];
    expect(String(url)).toContain("/blog/articles/3/favorite");
    expect(init.method).toBe("DELETE");
  });

  it("copies the article link", async () => {
    writeText.mockResolvedValue(undefined);
    renderActions(false);
    fireEvent.click(screen.getByRole("button", { name: /Copier le lien/ }));
    expect(await screen.findByText("Lien copié")).toBeTruthy();
    expect(writeText).toHaveBeenCalledWith(globalThis.location.href);
  });

  it("stays quiet when the clipboard is refused", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    renderActions(false);
    fireEvent.click(screen.getByRole("button", { name: /Copier le lien/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.queryByText("Lien copié")).toBeNull();
  });
});
