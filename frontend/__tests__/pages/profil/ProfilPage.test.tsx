import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: vi.fn(() => ({ replace: vi.fn() })) }));
vi.mock("@/app/lib/hooks", () => ({ useAppSelector: vi.fn() }));
vi.mock("@/app/hooks/useLogout", () => ({ useLogout: vi.fn() }));

import { useAppSelector } from "@/app/lib/hooks";
import { useLogout } from "@/app/hooks/useLogout";
import ProfilPage from "../../../app/(app)/profil/page";

type User = { id: string; email: string; fullName: string | null } | null;

function setUser(user: User, isAuthenticated = true) {
  vi.mocked(useAppSelector).mockImplementation((selector) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selector({ auth: { user, isAuthenticated, initializing: false } } as any),
  );
}

describe("ProfilPage", () => {
  const logout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLogout).mockReturnValue(logout);
    setUser({ id: "user-123", email: "alice@example.com", fullName: "Alice Dupont" });
  });

  it("shows the name, the e-mail and the avatar letter", () => {
    render(<ProfilPage />);
    expect(screen.getByText("Alice Dupont")).toBeTruthy();
    expect(screen.getAllByText("alice@example.com").length).toBeGreaterThan(0);
    expect(screen.getByText("A")).toBeTruthy();
  });

  it("splits the full name into first and last name", () => {
    render(<ProfilPage />);
    const [first] = screen.getAllByLabelText("Prénom") as HTMLInputElement[];
    const [last] = screen.getAllByLabelText("Nom") as HTMLInputElement[];
    expect(first.value).toBe("Alice");
    expect(last.value).toBe("Dupont");
  });

  it("keeps the e-mail read-only", () => {
    render(<ProfilPage />);
    const email = screen.getByLabelText("Adresse e-mail") as HTMLInputElement;
    expect(email.readOnly).toBe(true);
  });

  it("no longer shows the internal id", () => {
    render(<ProfilPage />);
    expect(screen.queryByText(/user-123/)).toBeNull();
  });

  it("presents the settings as one list", () => {
    render(<ProfilPage />);
    for (const title of ["Identité", "Compte", "Sécurité", "Session"]) {
      expect(screen.getAllByRole("heading", { name: title }).length).toBeGreaterThan(0);
    }
    expect(screen.queryByText("Zone de danger")).toBeNull();
  });

  it("disables what the backend can't do yet", () => {
    render(<ProfilPage />);
    expect(
      (screen.getByRole("button", { name: "Enregistrer" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Modifier" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("logs out from the Session row", () => {
    render(<ProfilPage />);
    fireEvent.click(screen.getAllByRole("button", { name: "Se déconnecter" })[0]);
    expect(logout).toHaveBeenCalled();
  });

  it("handles a single-word name and a missing name", () => {
    setUser({ id: "1", email: "bob@example.com", fullName: "Bob" });
    const { unmount } = render(<ProfilPage />);
    expect((screen.getAllByLabelText("Nom")[0] as HTMLInputElement).value).toBe("");
    unmount();

    setUser({ id: "1", email: "carl@example.com", fullName: null });
    render(<ProfilPage />);
    expect(screen.getAllByText("carl@example.com").length).toBeGreaterThan(0);
    expect(screen.getByText("C")).toBeTruthy();
  });

  it("waits for the session before showing anything", () => {
    setUser(null, false);
    render(<ProfilPage />);
    expect(screen.queryByText("Identité")).toBeNull();
  });
});
