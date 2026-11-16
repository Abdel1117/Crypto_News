import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, createNonce } from "@/app/lib/security/csp";

/**
 * Gives every page its Content-Security-Policy, with a nonce made for this
 * request alone. Next.js reads the policy from the request headers to put the
 * nonce on its own scripts; the root layout reads "x-nonce" for the theme script.
 */
export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const policy = buildCsp({
    nonce,
    isDev: process.env.NODE_ENV === "development",
    apiUrl: process.env.NEXT_PUBLIC_API_BACK_END,
    wsUrl: process.env.NEXT_PUBLIC_WS_BACK_END,
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: not Next's static files and optimized images, nor prefetches.
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
