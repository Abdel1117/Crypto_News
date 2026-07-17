import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchJson } from "../../app/lib/api/fetchJson";

function mockFetch(response: { ok: boolean; text: string }) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: response.ok,
      status: response.ok ? 200 : 400,
      text: async () => response.text,
    }),
  );
}

describe("fetchJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses and returns JSON on success", async () => {
    mockFetch({ ok: true, text: JSON.stringify({ foo: "bar" }) });

    const result = await fetchJson<{ foo: string }>("http://api/x");

    expect(result).toEqual({ foo: "bar" });
  });

  it("returns null when the response body is empty", async () => {
    mockFetch({ ok: true, text: "" });

    const result = await fetchJson("http://api/x");

    expect(result).toBeNull();
  });

  it("throws using the message field when the request fails", async () => {
    mockFetch({ ok: false, text: JSON.stringify({ message: "Bad input" }) });

    await expect(fetchJson("http://api/x")).rejects.toThrow("Bad input");
  });

  it("falls back to the detail field when message is absent", async () => {
    mockFetch({ ok: false, text: JSON.stringify({ detail: "Not found" }) });

    await expect(fetchJson("http://api/x")).rejects.toThrow("Not found");
  });

  it("falls back to a generic error when the body has no message/detail", async () => {
    mockFetch({ ok: false, text: "" });

    await expect(fetchJson("http://api/x")).rejects.toThrow(
      /Erreur 400 lors de la requête vers http:\/\/api\/x/,
    );
  });

  it("falls back to a generic error when the body is not valid JSON", async () => {
    mockFetch({ ok: false, text: "<html>oops</html>" });

    await expect(fetchJson("http://api/x")).rejects.toThrow(/Erreur 400/);
  });
});
