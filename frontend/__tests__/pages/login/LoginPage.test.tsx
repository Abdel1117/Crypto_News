import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/app/hooks/useRegistration", () => ({
  useRegistration: () => ({ register: vi.fn(), loading: false, result: null }),
}));

vi.mock("@/app/hooks/useLogin", () => ({
  useLogin: () => ({ login: vi.fn(), loading: false, result: null }),
}));

vi.mock("@/app/hooks/useGoogleLogin", () => ({
  useGoogleLogin: vi.fn(),
}));

vi.mock("@/app/lib/hooks", () => ({
  useAppSelector: vi.fn(() => ({ isAuthenticated: false, user: null })),
  useAppDispatch: vi.fn(() => () => {}),
}));

vi.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  GoogleLogin: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (response: { credential?: string }) => void;
    onError: () => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => onSuccess({ credential: "fake-google-credential" })}
      >
        MockGoogleLogin-Success
      </button>
      <button
        type="button"
        onClick={() => onSuccess({ credential: undefined })}
      >
        MockGoogleLogin-NoCredential
      </button>
      <button type="button" onClick={() => onError()}>
        MockGoogleLogin-Error
      </button>
    </div>
  ),
}));

import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/lib/hooks";
import { useGoogleLogin } from "@/app/hooks/useGoogleLogin";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Login from "../../../app/(landing)/login/page";

function renderLogin() {
  return render(
    <GoogleOAuthProvider clientId="test-client-id">
      <Login />
    </GoogleOAuthProvider>,
  );
}

describe("Login page", () => {
  const mockPush = vi.fn();
  const mockLoginGoogle = vi.fn();
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useGoogleLogin).mockReturnValue({
      loginGoogle: mockLoginGoogle,
      loading: false,
      result: null,
    });
  });

  it("renders the login form and tab controls", () => {
    renderLogin();

    expect(screen.getByText("Bon retour")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /^Se connecter$/i }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: /^Connexion$/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: /^Inscription$/ })
        .getAttribute("aria-pressed"),
    ).toBe("false");
    expect(screen.getByLabelText(/adresse e-mail/i)).toBeTruthy();
    expect(screen.getByLabelText("Mot de passe")).toBeTruthy();
  });

  it("switches to inscription tab when the inscription button is clicked", () => {
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: /^Inscription$/ }));

    expect(screen.getByText("Créez votre compte")).toBeTruthy();
    expect(screen.getByLabelText(/nom complet/i)).toBeTruthy();
    expect(screen.getByLabelText(/confirmer le mot de passe/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /s’inscrire/i })).toBeTruthy();
  });

  it("toggles the password visibility", () => {
    renderLogin();

    const input = screen.getByLabelText("Mot de passe") as HTMLInputElement;
    expect(input.type).toBe("password");

    fireEvent.click(
      screen.getByRole("button", { name: "Afficher le mot de passe" }),
    );
    expect(input.type).toBe("text");

    fireEvent.click(
      screen.getByRole("button", { name: "Masquer le mot de passe" }),
    );
    expect(input.type).toBe("password");
  });

  describe("Google login", () => {
    it("calls loginGoogle with the google credential and redirects on success", async () => {
      mockLoginGoogle.mockResolvedValue({
        success: true,
        message: "Connexion réussi. Bienvenu !",
      });
      renderLogin();

      fireEvent.click(
        screen.getByRole("button", { name: "MockGoogleLogin-Success" }),
      );

      await waitFor(() =>
        expect(mockLoginGoogle).toHaveBeenCalledWith("fake-google-credential"),
      );
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
      expect(screen.getByText("Connexion réussi. Bienvenu !")).toBeTruthy();
    });

    it("shows the failure notice and does not redirect when the backend rejects the google login", async () => {
      mockLoginGoogle.mockResolvedValue({
        success: false,
        message: "Une erreur est survenu lors pendant la connexxion.",
      });
      renderLogin();

      fireEvent.click(
        screen.getByRole("button", { name: "MockGoogleLogin-Success" }),
      );

      await waitFor(() =>
        expect(
          screen.getByText(
            "Une erreur est survenu lors pendant la connexxion.",
          ),
        ).toBeTruthy(),
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("shows an error notice and does not call loginGoogle when google itself errors", async () => {
      renderLogin();

      fireEvent.click(
        screen.getByRole("button", { name: "MockGoogleLogin-Error" }),
      );

      expect(
        screen.getByText(
          "Une erreur lors de l'authentification avec google est survenu",
        ),
      ).toBeTruthy();
      expect(mockLoginGoogle).not.toHaveBeenCalled();
    });

    it("does not call loginGoogle when the google response has no credential", async () => {
      renderLogin();

      fireEvent.click(
        screen.getByRole("button", { name: "MockGoogleLogin-NoCredential" }),
      );

      expect(mockLoginGoogle).not.toHaveBeenCalled();
    });
  });

  describe("already signed in", () => {
    type Auth = { isAuthenticated: boolean; initializing: boolean };
    const setAuth = (auth: Auth) =>
      vi.mocked(useAppSelector).mockImplementation((selector) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        selector({ auth: { ...auth, user: null } } as any),
      );

    afterEach(() => {
      setAuth({ isAuthenticated: false, initializing: false });
    });

    it("leaves /login once the restored session is known", () => {
      setAuth({ isAuthenticated: false, initializing: true });
      const { rerender } = renderLogin();
      expect(mockReplace).not.toHaveBeenCalled();

      setAuth({ isAuthenticated: true, initializing: false });
      rerender(
        <GoogleOAuthProvider clientId="test-client-id">
          <Login />
        </GoogleOAuthProvider>,
      );
      expect(mockReplace).toHaveBeenCalledWith("/profil");
    });

    it("stays on /login for signed-out visitors", () => {
      setAuth({ isAuthenticated: false, initializing: false });
      renderLogin();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("lets a fresh login go to the dashboard, not the profile", async () => {
      setAuth({ isAuthenticated: false, initializing: false });
      mockLoginGoogle.mockImplementation(async () => {
        setAuth({ isAuthenticated: true, initializing: false });
        return { success: true, message: "Connexion réussi. Bienvenu !" };
      });
      renderLogin();

      fireEvent.click(
        screen.getByRole("button", { name: "MockGoogleLogin-Success" }),
      );

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
      expect(mockReplace).not.toHaveBeenCalledWith("/profil");
    });
  });
});
