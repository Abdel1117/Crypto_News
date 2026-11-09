/**
 * Where to go after login: the `next` query parameter (e.g. the article the
 * reader wanted to like), only if it is a path on this site. Anything else —
 * "https://evil.example", "//evil.example", "/\evil" — is ignored, so the
 * login page can't be used to send people elsewhere.
 */
export function safeNextPath(search: string): string | null {
  const next = new URLSearchParams(search).get("next");
  if (!next?.startsWith("/")) return null;
  if (next.startsWith("//") || next.includes("\\")) return null;
  if ([...next].some((c) => c.charCodeAt(0) < 32)) return null;
  return next;
}

/** Login URL that brings the reader back to `path` afterwards. */
export function loginHref(path: string): string {
  return `/login?next=${encodeURIComponent(path)}`;
}

/** Read at submit time (not during render): no Suspense boundary needed. */
export function nextPathFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  return safeNextPath(window.location.search);
}
