import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/app/hooks/useRegistration", () => ({
  useRegistration: () => ({ register: vi.fn(), loading: false, result: null }),
}));

vi.mock("@/app/hooks/useLogin", () => ({
  useLogin: () => ({ login: vi.fn(), loading: false, result: null }),
}));

vi.mock("@/app/lib/hooks", () => ({
  useAppSelector: vi.fn(() => ({ isAuthenticated: false, user: null })),
  useAppDispatch: vi.fn(() => () => {}),
}));

import Login from "../../../app/(public)/login/page";

describe("Login page", () => {
  it("renders the login form and tab controls", () => {
    render(<Login />);

    expect(screen.getByText("Bienvenue de retour")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /^Se connecter$/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /^Inscrivez-vous$/i }),
    ).toBeTruthy();
    expect(screen.getByLabelText(/adresse e-mail/i)).toBeTruthy();
    expect(screen.getByLabelText(/mot de passe/i)).toBeTruthy();
  });

  it("switches to inscription tab when the inscription button is clicked", () => {
    render(<Login />);

    const registerTabButton = screen.getByRole("button", {
      name: /inscrivez-vous/i,
    });
    fireEvent.click(registerTabButton);

    expect(screen.getByText("Créez votre compte")).toBeTruthy();
    expect(screen.getByLabelText(/nom complet/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /s'inscrire/i })).toBeTruthy();
  });
});
