import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../app/lib/auth/tokenStorage", () => ({
  tokenStorage: {
    getAccessToken: vi.fn(() => null),
    setAccessToken: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

import { tokenStorage } from "../../../app/lib/auth/tokenStorage";

function makeToken(payload: object) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `${header}.${body}.signature`;
}

describe("authSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("starts unauthenticated when no token is stored", async () => {
    vi.mocked(tokenStorage.getAccessToken).mockReturnValue(null);
    const { default: authReducer } = await import(
      "../../../app/lib/features/auth/authSlice"
    );

    const state = authReducer(undefined, { type: "@@INIT" });
    expect(state).toEqual({ user: null, accessToken: null, isAuthenticated: false });
  });

  it("hydrates the user from a persisted, valid token", async () => {
    const token = makeToken({ sub: "1", email: "a@b.com", full_name: "Ada" });
    vi.mocked(tokenStorage.getAccessToken).mockReturnValue(token);
    const { default: authReducer } = await import(
      "../../../app/lib/features/auth/authSlice"
    );

    const state = authReducer(undefined, { type: "@@INIT" });
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual({ id: "1", email: "a@b.com", fullName: "Ada" });
  });

  it("falls back to unauthenticated when the persisted token is malformed", async () => {
    vi.mocked(tokenStorage.getAccessToken).mockReturnValue("not-a-jwt");
    const { default: authReducer } = await import(
      "../../../app/lib/features/auth/authSlice"
    );

    const state = authReducer(undefined, { type: "@@INIT" });
    expect(state.isAuthenticated).toBe(false);
  });

  it("logs the user in and persists the access token", async () => {
    vi.mocked(tokenStorage.getAccessToken).mockReturnValue(null);
    const { default: authReducer, loginSuccess } = await import(
      "../../../app/lib/features/auth/authSlice"
    );
    const token = makeToken({ sub: "2", email: "c@d.com" });

    const state = authReducer(undefined, loginSuccess({ accessToken: token }));

    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual({ id: "2", email: "c@d.com", fullName: null });
    expect(tokenStorage.setAccessToken).toHaveBeenCalledWith(token);
  });

  it("refreshes the token and updates the user", async () => {
    vi.mocked(tokenStorage.getAccessToken).mockReturnValue(null);
    const { default: authReducer, tokenRefreshed } = await import(
      "../../../app/lib/features/auth/authSlice"
    );
    const token = makeToken({ sub: "3", email: "e@f.com" });

    const state = authReducer(undefined, tokenRefreshed({ accessToken: token }));

    expect(state.accessToken).toBe(token);
    expect(state.user?.id).toBe("3");
  });

  it("clears the session on logout", async () => {
    vi.mocked(tokenStorage.getAccessToken).mockReturnValue(null);
    const { default: authReducer, logout } = await import(
      "../../../app/lib/features/auth/authSlice"
    );

    const state = authReducer(
      { user: { id: "1", email: "a@b.com", fullName: null }, accessToken: "x", isAuthenticated: true },
      logout(),
    );

    expect(state).toEqual({ user: null, accessToken: null, isAuthenticated: false });
    expect(tokenStorage.clearTokens).toHaveBeenCalled();
  });
});
