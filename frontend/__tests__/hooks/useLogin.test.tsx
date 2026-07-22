import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

vi.mock("../../app/lib/auth/api", () => ({
  loginUser: vi.fn(),
}));
vi.mock("../../app/lib/auth/tokenStorage", () => ({
  tokenStorage: {
    getAccessToken: vi.fn(() => null),
    setAccessToken: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

import { loginUser } from "../../app/lib/auth/api";
import authReducer from "../../app/lib/features/auth/authSlice";
import { useLogin } from "../../app/hooks/useLogin";

function wrapper({ children }: { children: React.ReactNode }) {
  const store = configureStore({ reducer: { auth: authReducer } });
  return <Provider store={store}>{children}</Provider>;
}

function makeToken(payload: object) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `${header}.${body}.signature`;
}

describe("useLogin", () => {
  beforeEach(() => {
    vi.mocked(loginUser).mockReset();
  });

  it("returns validation errors without calling the api", async () => {
    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.login({ email: "", password: "" });
    });

    expect(loginUser).not.toHaveBeenCalled();
    expect(result.current.result?.success).toBe(false);
  });

  it("logs in successfully and dispatches loginSuccess", async () => {
    const token = makeToken({ sub: "1", email: "a@b.com" });
    vi.mocked(loginUser).mockResolvedValue({
      access_token: token,
      token_type: "bearer",
      expires_in: 3600,
    });

    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.login({ email: "a@b.com", password: "secret" });
    });

    expect(result.current.result?.success).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it("stores an error message when the login fails", async () => {
    vi.mocked(loginUser).mockRejectedValue(new Error("Identifiants invalides"));
    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.login({ email: "a@b.com", password: "secret" });
    });

    expect(result.current.result).toEqual({
      success: false,
      message: "Identifiants invalides",
    });
  });
});
