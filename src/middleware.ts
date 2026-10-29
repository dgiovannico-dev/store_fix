import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { evaluateApiCsrf } from "@/infrastructure/security/csrf-origin";
import { resolveServerActionsAllowedOrigins } from "@/infrastructure/security/server-actions-origins";

/**
 * Security baseline headers (US-E10-07 / T4.6) + CSRF gate on mutating `/api/*`.
 * CSP permissiva per Next.js + Tailwind inline; frame deny; nosniff.
 */
export function middleware(request: NextRequest) {
  const requestId =
    request.headers.get("x-request-id") ?? crypto.randomUUID();

  const csrf = evaluateApiCsrf({
    method: request.method,
    pathname: request.nextUrl.pathname,
    origin: request.headers.get("origin"),
    secFetchSite: request.headers.get("sec-fetch-site"),
    requestHost:
      request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
    allowedHosts: resolveServerActionsAllowedOrigins({
      SERVER_ACTIONS_ALLOWED_ORIGINS:
        process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ??
        process.env.CSRF_ALLOWED_ORIGINS,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      FF_DOMAIN: process.env.FF_DOMAIN,
    }),
  });

  if (!csrf.allow) {
    return NextResponse.json(
      { error: "Forbidden", code: "csrf_origin", reason: csrf.reason },
      {
        status: 403,
        headers: { "X-Request-Id": requestId },
      },
    );
  }

  const response = NextResponse.next({
    request: {
      headers: (() => {
        const h = new Headers(request.headers);
        h.set("x-request-id", requestId);
        return h;
      })(),
    },
  });

  // unsafe-eval solo in dev (HMR); prod stringe CSP (docs/ops/SECURITY_HEADERS.md)
  const scriptSrc =
    process.env.NODE_ENV === "production"
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: http: https:",
    "font-src 'self' data:",
    "connect-src 'self' http: https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Request-Id", requestId);
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
