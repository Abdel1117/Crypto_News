/**
 * The site's Content-Security-Policy: what a page may load and run.
 *
 * Scripts only run if they carry the nonce made for the request (see
 * proxy.ts), so a script injected into a page — through an article, a comment,
 * a coin name — stays text. Next.js puts the nonce on its own scripts.
 */

export interface CspOptions {
  /** Random value of this request; see createNonce. */
  nonce: string;
  /** `next dev`: React needs eval for its debugging tools. */
  isDev: boolean;
  /** NEXT_PUBLIC_API_BACK_END and NEXT_PUBLIC_WS_BACK_END. */
  apiUrl?: string;
  wsUrl?: string;
}

const GOOGLE_SIGN_IN = "https://accounts.google.com/gsi/";
const PLAUSIBLE = "https://plausible.io";

/** "https://host:port" of an absolute URL; null for a path ("/api") or nothing. */
function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const { protocol, host } = new URL(url);
    return `${protocol}//${host}`;
  } catch {
    return null;
  }
}

export function createNonce(): string {
  return btoa(crypto.randomUUID());
}

export function buildCsp({ nonce, isDev, apiUrl, wsUrl }: CspOptions): string {
  const api = originOf(apiUrl);
  // Only when the API isn't served by the site itself (development).
  const backends = [api, originOf(wsUrl)].filter((o): o is string => o !== null);

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'strict-dynamic': scripts loaded by a trusted script are trusted too
    // (Next's chunks, Google's sign-in). Browsers that know it ignore 'self'
    // and the https: fallback, which are there for the older ones.
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      `${GOOGLE_SIGN_IN}client`,
    ],
    // Inline styles are everywhere (style={...} on components) and can't run code.
    "style-src": ["'self'", "'unsafe-inline'", `${GOOGLE_SIGN_IN}style`],
    // Articles are Markdown: their images can come from any https site.
    "img-src": ["'self'", "data:", "blob:", "https:", ...(api ? [api] : [])],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...backends, PLAUSIBLE, GOOGLE_SIGN_IN],
    "frame-src": [GOOGLE_SIGN_IN],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}
