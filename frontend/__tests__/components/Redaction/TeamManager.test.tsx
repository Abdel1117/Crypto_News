import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import TeamManager from "@/app/components/Redaction/TeamManager";
import type { TeamMember } from "@/app/lib/api/blog";
import { jsonResponse, renderWithAuth } from "../../lib/blogTestUtils";

const ME: TeamMember = {
  id: 7,
  full_name: "Moi Même",
  email: "me@example.com",
  role: "admin",
  created_at: "2026-01-01T00:00:00",
};
const BOB: TeamMember = { ...ME, id: 8, full_name: "Bob Lecteur", email: "bob@example.com", role: "user" };

const fetchMock = vi.fn();

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(jsonResponse(200, [ME, BOB]));
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(350);
  });
}

describe("TeamManager", () => {
  it("lists accounts with their role", async () => {
    renderWithAuth(<TeamManager />, "admin");
    await settle();
    const bob = screen.getByRole("group", { name: "Rôle de Bob Lecteur" });
    expect(within(bob).getByRole("button", { name: "Lecteur" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByText("(vous)")).toBeTruthy();
  });

  it("searches after a short pause", async () => {
    renderWithAuth(<TeamManager />, "admin");
    await settle();
    fireEvent.change(screen.getByLabelText("Rechercher un compte"), { target: { value: "bo" } });
    fireEvent.change(screen.getByLabelText("Rechercher un compte"), { target: { value: "bob" } });
    await settle();

    const urls = fetchMock.mock.calls.map(([u]) => String(u));
    expect(urls.at(-1)).toContain("/admin/users?query=bob");
    expect(urls.some((u) => u.endsWith("query=bo"))).toBe(false);
  });

  it("promotes an account", async () => {
    renderWithAuth(<TeamManager />, "admin");
    await settle();
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ...BOB, role: "editor" }));
    const bob = screen.getByRole("group", { name: "Rôle de Bob Lecteur" });
    fireEvent.click(within(bob).getByRole("button", { name: "Éditeur" }));

    expect((await screen.findByRole("status")).textContent).toMatch(/Bob Lecteur est maintenant éditeur/);
    expect(within(bob).getByRole("button", { name: "Éditeur" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/admin/users/8/role");
    expect(JSON.parse(init.body)).toEqual({ role: "editor" });
  });

  it("doesn't let an admin demote themselves", async () => {
    renderWithAuth(<TeamManager />, "admin");
    await settle();
    const mine = screen.getByRole("group", { name: "Rôle de Moi Même" });
    expect((within(mine).getByRole("button", { name: "Lecteur" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("shows API errors", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(403, { detail: "Accès réservé aux administrateurs." }));
    renderWithAuth(<TeamManager />, "admin");
    await settle();
    expect(screen.getByRole("alert").textContent).toBe("Accès réservé aux administrateurs.");
  });
});
