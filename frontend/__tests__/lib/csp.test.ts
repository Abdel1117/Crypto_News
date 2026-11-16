import { describe, expect, it } from "vitest";
import { buildCsp, createNonce } from "../../app/lib/security/csp";

const PROD = {
  nonce: "abc123",
  isDev: false,
  apiUrl: "https://crypto-explorer.fr/api",
  wsUrl: "wss://crypto-explorer.fr/ws",
};

/** The policy as { directive: [sources] }. */
function parse(policy: string): Record<string, string[]> {
  return Object.fromEntries(
    policy.split("; ").map((directive) => {
      const [name, ...sources] = directive.split(" ");
      return [name, sources];
    }),
  );
}

describe("buildCsp", () => {
  it("only runs scripts carrying the request's nonce", () => {
    const scripts = parse(buildCsp(PROD))["script-src"];
    expect(scripts).toContain("'nonce-abc123'");
    expect(scripts).toContain("'strict-dynamic'");
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("'unsafe-eval'");
  });

  it("allows eval in development only, for React's debugging tools", () => {
    const scripts = parse(buildCsp({ ...PROD, isDev: true }))["script-src"];
    expect(scripts).toContain("'unsafe-eval'");
  });

  it("lets the page call the API, the live prices, Plausible and Google", () => {
    const connect = parse(buildCsp(PROD))["connect-src"];
    expect(connect).toEqual([
      "'self'",
      "https://crypto-explorer.fr",
      "wss://crypto-explorer.fr",
      "https://plausible.io",
      "https://accounts.google.com/gsi/",
    ]);
  });

  it("allows a separate API host, as in development", () => {
    const policy = parse(
      buildCsp({ ...PROD, apiUrl: "http://localhost:4000", wsUrl: "ws://localhost:4000" }),
    );
    expect(policy["connect-src"]).toContain("http://localhost:4000");
    expect(policy["connect-src"]).toContain("ws://localhost:4000");
    // Cover images are served by the API.
    expect(policy["img-src"]).toContain("http://localhost:4000");
  });

  it("ignores a missing or relative API address: 'self' covers it", () => {
    const connect = parse(buildCsp({ ...PROD, apiUrl: "/api", wsUrl: undefined }))["connect-src"];
    expect(connect).toEqual(["'self'", "https://plausible.io", "https://accounts.google.com/gsi/"]);
  });

  it("only frames Google's sign-in button, and can't be framed itself", () => {
    const policy = parse(buildCsp(PROD));
    expect(policy["frame-src"]).toEqual(["https://accounts.google.com/gsi/"]);
    expect(policy["frame-ancestors"]).toEqual(["'none'"]);
    expect(policy["object-src"]).toEqual(["'none'"]);
    expect(policy["base-uri"]).toEqual(["'self'"]);
    expect(policy["form-action"]).toEqual(["'self'"]);
    expect(policy["default-src"]).toEqual(["'self'"]);
  });

  it("is a single header line", () => {
    expect(buildCsp(PROD)).not.toMatch(/[\r\n]/);
  });
});

describe("createNonce", () => {
  it("is different for every request", () => {
    const nonces = new Set(Array.from({ length: 50 }, createNonce));
    expect(nonces.size).toBe(50);
    expect([...nonces][0]).toMatch(/^[A-Za-z0-9+/=]{20,}$/);
  });
});
