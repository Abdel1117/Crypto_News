import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { tokenStorage } from "../../auth/tokenStorage";

type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
};

function decodeJwtPayload(token: string): { sub: string; email: string; full_name?: string | null } | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function buildInitialState(): AuthState {
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    const decoded = decodeJwtPayload(accessToken);
    if (decoded) {
      return {
        user: { id: decoded.sub, email: decoded.email },
        accessToken,
        isAuthenticated: true,
      };
    }
  }
  return { user: null, accessToken: null, isAuthenticated: false };
}

const authSlice = createSlice({
  name: "auth",
  initialState: buildInitialState(),
  reducers: {
    loginSuccess(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>,
    ) {
      const { accessToken, refreshToken } = action.payload;
      const decoded = decodeJwtPayload(accessToken);
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.user = decoded ? { id: decoded.sub, email: decoded.email, fullName: decoded.full_name ?? null } : null;
      tokenStorage.setTokens(accessToken, refreshToken);
    },

    tokenRefreshed(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>,
    ) {
      const { accessToken, refreshToken } = action.payload;
      const decoded = decodeJwtPayload(accessToken);
      state.accessToken = accessToken;
      state.user = decoded ? { id: decoded.sub, email: decoded.email, fullName: decoded.full_name ?? null } : null;
      tokenStorage.setTokens(accessToken, refreshToken);
    },

    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      tokenStorage.clearTokens();
    },
  },
});

export const { loginSuccess, tokenRefreshed, logout } = authSlice.actions;
export default authSlice.reducer;
