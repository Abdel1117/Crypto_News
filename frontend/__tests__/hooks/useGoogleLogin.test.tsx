import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("@/app/lib/hooks", () => ({
  useAppDispatch: vi.fn(),
}));

vi.mock("@/app/lib/auth/api", () => ({
  loginWithGoogle: vi.fn(),
}));

import { useAppDispatch } from "@/app/lib/hooks";
import { loginWithGoogle } from "@/app/lib/auth/api";
import { loginSuccess } from "@/app/lib/features/auth/authSlice";
import { useGoogleLogin } from "@/app/hooks/useGoogleLogin";

const CREDENTIAL = "google-credential-token";

describe("useGoogleLogin", () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(mockDispatch);
  });

  it("has no result and is not loading before any call", () => {
    const { result } = renderHook(() => useGoogleLogin());

    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeNull();
  });

  it("dispatches loginSuccess with the access token on success", async () => {
    vi.mocked(loginWithGoogle).mockResolvedValue({
      access_token: "abc123",
      token_type: "bearer",
      expires_in: 3600,
    });
    const { result } = renderHook(() => useGoogleLogin());

    await act(async () => {
      await result.current.loginGoogle(CREDENTIAL);
    });

    expect(loginWithGoogle).toHaveBeenCalledWith(CREDENTIAL);
    expect(mockDispatch).toHaveBeenCalledWith(loginSuccess({ accessToken: "abc123" }));
  });

  it("returns a success result on success", async () => {
    vi.mocked(loginWithGoogle).mockResolvedValue({
      access_token: "abc123",
      token_type: "bearer",
      expires_in: 3600,
    });
    const { result } = renderHook(() => useGoogleLogin());

    let loginResult;
    await act(async () => {
      loginResult = await result.current.loginGoogle(CREDENTIAL);
    });

    expect(loginResult).toEqual({
      success: true,
      message: "Connexion réussi. Bienvenu !",
    });
    expect(result.current.result).toEqual(loginResult);
  });

  it("does not dispatch and returns the error message when the API call rejects with an Error", async () => {
    vi.mocked(loginWithGoogle).mockRejectedValue(new Error("Invalid Google credentials."));
    const { result } = renderHook(() => useGoogleLogin());

    let loginResult;
    await act(async () => {
      loginResult = await result.current.loginGoogle(CREDENTIAL);
    });

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(loginResult).toEqual({
      success: false,
      message: "Invalid Google credentials.",
    });
  });

  it("returns a generic failure message when the rejection is not an Error instance", async () => {
    vi.mocked(loginWithGoogle).mockRejectedValue("network down");
    const { result } = renderHook(() => useGoogleLogin());

    let loginResult;
    await act(async () => {
      loginResult = await result.current.loginGoogle(CREDENTIAL);
    });

    expect(loginResult).toEqual({
      success: false,
      message: "Une erreur est survenu lors pendant la connexxion.",
    });
  });

  it("sets loading to true while the request is in flight and false once it settles", async () => {
    let resolveLogin: (value: {
      access_token: string;
      token_type: string;
      expires_in: number;
    }) => void = () => {};
    vi.mocked(loginWithGoogle).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    );
    const { result } = renderHook(() => useGoogleLogin());

    expect(result.current.loading).toBe(false);

    act(() => {
      void result.current.loginGoogle(CREDENTIAL);
    });

    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      resolveLogin({ access_token: "tok", token_type: "bearer", expires_in: 10 });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
