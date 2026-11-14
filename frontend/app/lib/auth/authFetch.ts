import type { AppDispatch, RootState } from "../store";
import { refreshSession } from "../features/auth/authThunks";

/** Refresh the access token when it expires within this margin. */
const TOKEN_MARGIN_MS = 30_000;

export const SESSION_EXPIRED = "Ta session a expiré. Reconnecte-toi pour continuer.";

/** An error answered by the API, with its HTTP status and a readable message. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ThunkTools {
  dispatch: AppDispatch;
  getState: () => RootState;
}

/** A valid access token, refreshed when about to expire; null if logged out. */
export async function getValidToken(
  { dispatch, getState }: ThunkTools,
  force = false,
): Promise<string | null> {
  const { accessToken, expiresAt } = getState().auth;
  const fresh =
    accessToken && expiresAt && expiresAt - Date.now() > TOKEN_MARGIN_MS;
  if (fresh && !force) return accessToken;
  try {
    const tokens = await dispatch(refreshSession()).unwrap();
    return tokens.access_token;
  } catch {
    return null;
  }
}

/** FastAPI errors: `detail` is a string, or a list of validation errors. */
function readDetail(data: unknown, status: number): string {
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0] && typeof detail[0].msg === "string") {
      return detail[0].msg.replace(/^Value error, /, "");
    }
  }
  return `Erreur ${status}`;
}

/** The parsed body, or null when it is empty or isn't JSON. */
function parseJsonBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function withAccessToken(init: RequestInit, token: string): RequestInit {
  return {
    ...init,
    headers: {
      // JSON bodies only: a FormData (file upload) gets its multipart type,
      // with its boundary, from the browser.
      ...(typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}

/** The JSON body of a successful response; an ApiError otherwise. */
async function readJsonResponse<T>(res: Response): Promise<T> {
  const data = parseJsonBody(await res.text());
  if (!res.ok) {
    throw new ApiError(
      res.status,
      res.status === 401 ? SESSION_EXPIRED : readDetail(data, res.status),
    );
  }
  return data as T;
}

/**
 * JSON request with the user's access token. A rejected token (401) is
 * refreshed once and the request retried.
 */
export async function authFetchJson<T>(
  url: string,
  init: RequestInit,
  tools: ThunkTools,
): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getValidToken(tools, attempt > 0);
    if (!token) throw new ApiError(401, SESSION_EXPIRED);

    const res = await fetch(url, withAccessToken(init, token));
    if (res.status === 401 && attempt === 0) continue;
    return readJsonResponse<T>(res);
  }
  throw new ApiError(401, SESSION_EXPIRED);
}
