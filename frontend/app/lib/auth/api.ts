import { AuthTokens, LoginData } from "./login";
import { RegistrationPayload } from "./registration";
import { fetchJson } from "../api/fetchJson";

const API = process.env.NEXT_PUBLIC_API_BACK_END;

export async function registerUser(payload: RegistrationPayload) {
  return fetchJson(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: LoginData): Promise<AuthTokens> {
  return fetchJson<AuthTokens>(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function refreshToken(token: string): Promise<AuthTokens> {
  return fetchJson<AuthTokens>(`${API}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: token }),
  });
}
