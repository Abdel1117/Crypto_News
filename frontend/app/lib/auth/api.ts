import { AuthTokens, LoginData } from "./login";
import { RegistrationPayload } from "./registration";
import { fetchJson } from "../api/fetchJson";

const API = process.env.NEXT_PUBLIC_API_BACK_END;


export async function loginWithGoogle(credentials : string )  {
  console.log(credentials)  
  return fetchJson<AuthTokens>(`${API}/auth/google` , {
    method : "POST",
    headers : {"Content-Type" : "application/json"},
    body : JSON.stringify({credentials})
  })

}


export async function registerUser(payload: RegistrationPayload): Promise<{ message: string }> {
  return fetchJson<{ message: string }>(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: LoginData): Promise<AuthTokens> {
  return fetchJson<AuthTokens>(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export async function refreshAccessToken(): Promise<AuthTokens> {
  return fetchJson<AuthTokens>(`${API}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
}

export async function logoutUser(): Promise<void> {
  await fetchJson(`${API}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}
