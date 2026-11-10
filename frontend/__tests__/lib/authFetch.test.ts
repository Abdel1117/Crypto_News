import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, SESSION_EXPIRED, authFetchJson } from "@/app/lib/auth/authFetch";
import { jsonResponse, makeProStore } from "./simulationProTestUtils";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The ApiError a call rejects with (fails the test if it resolves). */
async function failure(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (e) {
    return e as ApiError;
  }
  throw new Error("expected the call to fail");
}

const tools = (store: ReturnType<typeof makeProStore>) => ({
  dispatch: store.dispatch,
  getState: store.getState as never,
});

describe("authFetchJson", () => {
  it("sends the access token and parses the JSON answer", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const store = makeProStore();

    await expect(authFetchJson("/api/x", {}, tools(store))).resolves.toEqual({ ok: 1 });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer token-1");
  });

  it("adds a JSON content type only when there is a body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    vi.stubGlobal("fetch", fetchMock);
    const store = makeProStore();

    await authFetchJson("/api/x", { method: "POST", body: "{}" }, tools(store));
    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBe("application/json");
  });

  it("leaves a file upload's content type to the browser", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    vi.stubGlobal("fetch", fetchMock);
    const store = makeProStore();

    await authFetchJson("/api/x", { method: "POST", body: new FormData() }, tools(store));
    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBeUndefined();
  });

  it("refreshes a rejected token once and retries", async () => {
    let calls = 0;
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) => {
      if (url.endsWith("/auth/refresh")) {
        return jsonResponse(200, { access_token: "token-2", expires_in: 900 });
      }
      calls += 1;
      return calls === 1 ? jsonResponse(401, { detail: "no" }) : jsonResponse(200, { ok: 2 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const store = makeProStore();

    await expect(authFetchJson("/api/x", {}, tools(store))).resolves.toEqual({ ok: 2 });
    const apiCalls = fetchMock.mock.calls.filter(([u]) => !String(u).endsWith("/auth/refresh"));
    const headers = apiCalls[1][1]!.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token-2");
  });

  it("reports an expired session when the refresh fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, { detail: "no" })));
    const store = makeProStore();

    const error = await failure(authFetchJson("/api/x", {}, tools(store)));
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe(SESSION_EXPIRED);
  });

  it("uses the server's message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(409, { detail: "Solde insuffisant pour cet achat." })),
    );
    const error = await failure(authFetchJson("/api/x", {}, tools(makeProStore())));
    expect(error.status).toBe(409);
    expect(error.message).toBe("Solde insuffisant pour cet achat.");
  });

  it("reads the first validation error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(422, { detail: [{ msg: "Value error, Indique soit une quantité, soit un montant." }] }),
      ),
    );
    const error = await failure(authFetchJson("/api/x", {}, tools(makeProStore())));
    expect(error.message).toBe("Indique soit une quantité, soit un montant.");
  });

  it("refuses to call the API when logged out", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, {}));
    vi.stubGlobal("fetch", fetchMock);
    const store = makeProStore({}, false);

    const error = await failure(authFetchJson("/api/x", {}, tools(store)));
    expect(error.status).toBe(401);
    expect(fetchMock.mock.calls.every(([u]) => String(u).endsWith("/auth/refresh"))).toBe(true);
  });
});
