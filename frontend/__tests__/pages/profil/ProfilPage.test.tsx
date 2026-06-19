import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/app/lib/features/auth/authSlice", () => ({
  logout: vi.fn(() => ({ type: "auth/logout" })),
}));

vi.mock("@/app/lib/hooks", () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
}));

import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import { logout } from "@/app/lib/features/auth/authSlice";
import ProfilPage from "../../../app/(app)/profil/page";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUser = {
  id: "user-123",
  email: "alice@example.com",
  fullName: "Alice Dupont",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ProfilPage", () => {
  const mockDispatch = vi.fn();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(mockDispatch);
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as ReturnType<typeof useRouter>);
    vi.mocked(useAppSelector).mockImplementation((selector) =>
      selector({ auth: { user: mockUser } } as any),
    );
  });

  describe("with an authenticated user", () => {
    it("renders without crashing", () => {
      const { container } = render(<ProfilPage />);
      expect(container.firstChild).toBeTruthy();
    });

    it("displays the user full name as the h1 heading", () => {
      render(<ProfilPage />);
      expect(
        screen.getByRole("heading", { level: 1, name: "Alice Dupont" }),
      ).toBeTruthy();
    });

    it("displays the user email", () => {
      render(<ProfilPage />);
      const emails = screen.getAllByText("alice@example.com");
      expect(emails.length).toBeGreaterThan(0);
    });

    it("displays the user ID", () => {
      render(<ProfilPage />);
      // ID appears in both the identity header and the Compte card
      expect(screen.getAllByText(/user-123/).length).toBeGreaterThan(0);
    });

    it("shows the avatar letter (first letter of email, uppercased)", () => {
      render(<ProfilPage />);
      expect(screen.getByText("A")).toBeTruthy();
    });

    it("splits fullName into Prénom and Nom fields", () => {
      render(<ProfilPage />);
      expect(screen.getByText("Alice")).toBeTruthy();
      expect(screen.getByText("Dupont")).toBeTruthy();
    });

    it("renders the Identité card", () => {
      render(<ProfilPage />);
      expect(screen.getByText("Identité")).toBeTruthy();
    });

    it("renders the Compte card", () => {
      render(<ProfilPage />);
      expect(screen.getByText("Compte")).toBeTruthy();
    });

    it("renders the Sécurité card with a password mask", () => {
      render(<ProfilPage />);
      expect(screen.getByText("Sécurité")).toBeTruthy();
      expect(screen.getByText("••••••••")).toBeTruthy();
    });

    it("renders the Zone de danger card", () => {
      render(<ProfilPage />);
      expect(screen.getByText("Zone de danger")).toBeTruthy();
    });

    it("renders a single logout button", () => {
      render(<ProfilPage />);
      expect(
        screen.getByRole("button", { name: /déconnecter/i }),
      ).toBeTruthy();
    });

    it("dispatches logout action when logout button is clicked", () => {
      render(<ProfilPage />);
      fireEvent.click(screen.getByRole("button", { name: /déconnecter/i }));
      expect(mockDispatch).toHaveBeenCalledWith({ type: "auth/logout" });
    });

    it("redirects to /login after logout", () => {
      render(<ProfilPage />);
      fireEvent.click(screen.getByRole("button", { name: /déconnecter/i }));
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  describe("with a single-word fullName", () => {
    beforeEach(() => {
      vi.mocked(useAppSelector).mockImplementation((selector) =>
        selector({ auth: { user: { ...mockUser, fullName: "Alice" } } } as any),
      );
    });

    it("shows the first name correctly", () => {
      render(<ProfilPage />);
      // Single word → appears in both h1 and Prénom field
      expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    });

    it("shows '—' as the last name when missing", () => {
      render(<ProfilPage />);
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  describe("with no authenticated user (user = null)", () => {
    beforeEach(() => {
      vi.mocked(useAppSelector).mockImplementation((selector) =>
        selector({ auth: { user: null } } as any),
      );
    });

    it("renders without crashing", () => {
      const { container } = render(<ProfilPage />);
      expect(container.firstChild).toBeTruthy();
    });

    it("shows '?' as the avatar letter", () => {
      render(<ProfilPage />);
      expect(screen.getByText("?")).toBeTruthy();
    });

    it("shows '—' fallbacks for name, email and ID", () => {
      render(<ProfilPage />);
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThanOrEqual(3);
    });
  });
});
