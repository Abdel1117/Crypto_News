import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { refreshSession } from "./authThunks";

type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  initializing: boolean;
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  expiresAt: null,
  isAuthenticated: false,
  initializing: true,
};

function decodeJwtPayload(token: string): { sub: string; email: string; full_name?: string | null } | null {
  try {
    const base64 = token.split(".")[1].replaceAll(/-/g, "+").replaceAll(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// Access token lives only in memory (Redux state) — never persisted, so it
// disappears on reload/tab close. Sessions survive reloads via the httpOnly
// refresh cookie instead (see authThunks.refreshSession).
function applyTokens(state: AuthState, accessToken: string, expiresIn: number) {
  const decoded = decodeJwtPayload(accessToken);
  state.accessToken = accessToken;
  state.expiresAt = Date.now() + expiresIn * 1000;
  state.isAuthenticated = true;
  state.user = decoded ? { id: decoded.sub, email: decoded.email, fullName: decoded.full_name ?? null } : null;
}

function clearSession(state: AuthState) {
  state.user = null;
  state.accessToken = null;
  state.expiresAt = null;
  state.isAuthenticated = false;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ accessToken: string; expiresIn: number }>) {
      applyTokens(state, action.payload.accessToken, action.payload.expiresIn);
      state.initializing = false;
    },

    logout(state) {
      clearSession(state);
      state.initializing = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshSession.fulfilled, (state, action) => {
        applyTokens(state, action.payload.access_token, action.payload.expires_in);
        state.initializing = false;
      })
      .addCase(refreshSession.rejected, (state) => {
        clearSession(state);
        state.initializing = false;
      });
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
