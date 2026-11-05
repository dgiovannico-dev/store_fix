import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  hasSessionCookie,
  requiresAuthSession,
} from "@/infrastructure/auth/protected-path";
import { shouldUseSecureAuthCookies } from "@/infrastructure/auth/secure-cookies";
import { applyBaselineSecurityHeaders } from "@/infrastructure/security/apply-baseline-security-headers";
import { evaluateApiCsrf } from "@/infrastructure/security/csrf-origin";
import { resolveServerActionsAllowedOrigins } from "@/infrastructure/security/server-actions-origins";

/**
 * Security baseline headers + CSRF + auth cookie gate on /app|/vendor|/onboarding.
 * Full session validation resta in layout RSC (`auth()`); Edge evita Prisma JWT callback.
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

  const pathname = request.nextUrl.pathname;
  if (requiresAuthSession(pathname)) {
    const secure = shouldUseSecureAuthCookies({
      NODE_ENV: process.env.NODE_ENV,
      AUTH_URL: process.env.AUTH_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      FF_DOMAIN: process.env.FF_DOMAIN,
      AUTH_SECURE_COOKIES: process.env.AUTH_SECURE_COOKIES,
    });
    if (!hasSessionCookie(request.headers.get("cookie"), secure)) {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      const redirect = NextResponse.redirect(login);
      redirect.headers.set("X-Request-Id", requestId);
      return redirect;
    }
  }

  const response = NextResponse.next({
    request: {
      headers: (() => {
        const h = new Headers(request.headers);
        h.set("x-request-id", requestId);
        /** Consumed by AppChrome audience path guard (RSC). */
        h.set("x-ff-pathname", pathname);
        return h;
      })(),
    },
  });

  applyBaselineSecurityHeaders(response.headers, {
    pathname,
    requestId,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      FF_DOMAIN: process.env.FF_DOMAIN,
      FF_CSP_UPGRADE_INSECURE: process.env.FF_CSP_UPGRADE_INSECURE,
    },
  });

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
