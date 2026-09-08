import { describe, expect, it } from "vitest";
import authReducer, { loginSuccess, logout } from "../../../app/lib/features/auth/authSlice";
import { refreshSession } from "../../../app/lib/features/auth/authThunks";

function makeToken(payload: object) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `${header}.${body}.signature`;
}

describe("authSlice", () => {
  it("starts unauthenticated and initializing (no token is ever persisted)", () => {
    const state = authReducer(undefined, { type: "@@INIT" });
    expect(state).toEqual({
      user: null,
      accessToken: null,
      expiresAt: null,
      isAuthenticated: false,
      initializing: true,
    });
  });

  it("logs the user in from a valid access token", () => {
    const token = makeToken({ sub: "2", email: "c@d.com" });
    const before = Date.now();

    const state = authReducer(undefined, loginSuccess({ accessToken: token, expiresIn: 3600 }));

    expect(state.isAuthenticated).toBe(true);
    expect(state.initializing).toBe(false);
    expect(state.accessToken).toBe(token);
    expect(state.user).toEqual({ id: "2", email: "c@d.com", fullName: null });
    expect(state.expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000);
  });

  it("falls back to no user when the access token cannot be decoded", () => {
    const state = authReducer(undefined, loginSuccess({ accessToken: "not-a-jwt", expiresIn: 60 }));

    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toBeNull();
  });

  it("restores the session on refreshSession.fulfilled (silent bootstrap/rotation)", () => {
    const token = makeToken({ sub: "3", email: "e@f.com", full_name: "Ева" });

    const state = authReducer(
      { user: null, accessToken: null, expiresAt: null, isAuthenticated: false, initializing: true },
      refreshSession.fulfilled(
        { access_token: token, token_type: "bearer", expires_in: 30 },
        "requestId",
      ),
    );

    expect(state.isAuthenticated).toBe(true);
    expect(state.initializing).toBe(false);
    expect(state.accessToken).toBe(token);
    expect(state.user?.email).toBe("e@f.com");
  });

  it("clears the session on refreshSession.rejected (no/expired refresh cookie)", () => {
    const token = makeToken({ sub: "1", email: "a@b.com" });

    const state = authReducer(
      {
        user: { id: "1", email: "a@b.com", fullName: null },
        accessToken: token,
        expiresAt: Date.now() + 1000,
        isAuthenticated: true,
        initializing: false,
      },
      refreshSession.rejected(new Error("expired"), "requestId"),
    );

    expect(state).toEqual({
      user: null,
      accessToken: null,
      expiresAt: null,
      isAuthenticated: false,
      initializing: false,
    });
  });

  it("clears the session on logout", () => {
    const state = authReducer(
      {
        user: { id: "1", email: "a@b.com", fullName: null },
        accessToken: "x",
        expiresAt: Date.now() + 1000,
        isAuthenticated: true,
        initializing: false,
      },
      logout(),
    );

    expect(state).toEqual({
      user: null,
      accessToken: null,
      expiresAt: null,
      isAuthenticated: false,
      initializing: false,
    });
  });
});
