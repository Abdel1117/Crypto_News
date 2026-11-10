import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

import FavoritesPage, { metadata } from "../../../app/(public)/blog/favoris/page";
import { jsonResponse, makeArticle, renderWithAuth } from "../../lib/blogTestUtils";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  replace.mockReset();
  vi.unstubAllGlobals();
});

describe("FavoritesPage", () => {
  it("is kept out of search engines", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("lists the reader's saved articles", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, [makeArticle({ id: 1, title: "Gardé pour plus tard" })]),
    );
    renderWithAuth(<FavoritesPage />, "user");
    expect(await screen.findByText("Gardé pour plus tard")).toBeTruthy();
    expect(String(fetchMock.mock.calls[0][0])).toContain("/blog/favorites");
  });

  it("explains how to add favorites when there are none", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []));
    renderWithAuth(<FavoritesPage />, "user");
    expect(await screen.findByText(/Aucun favori pour l’instant/)).toBeTruthy();
  });

  it("shows API errors", async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, { detail: "Erreur serveur." }));
    renderWithAuth(<FavoritesPage />, "user");
    expect((await screen.findByRole("alert")).textContent).toBe("Erreur serveur.");
  });

  it("sends logged-out visitors to the login page", () => {
    renderWithAuth(<FavoritesPage />);
    expect(replace).toHaveBeenCalledWith("/login");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
