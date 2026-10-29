import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { shouldUpgradeInsecureRequests } from "@/infrastructure/security/csp-upgrade";
import { evaluateApiCsrf } from "@/infrastructure/security/csrf-origin";
import { referrerPolicyForPath } from "@/infrastructure/security/referrer-policy";
import { resolveServerActionsAllowedOrigins } from "@/infrastructure/security/server-actions-origins";
import { applyNoStore } from "@/infrastructure/security/session-cleanup-headers";

/**
 * Security baseline headers (US-E10-07 / T4.6) + CSRF gate on mutating `/api/*` + `/logout`.
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

  const cspParts = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: http: https:",
    "font-src 'self' data:",
    "connect-src 'self' http: https:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ];
  if (
    shouldUpgradeInsecureRequests({
      NODE_ENV: process.env.NODE_ENV,
      FF_DOMAIN: process.env.FF_DOMAIN,
      FF_CSP_UPGRADE_INSECURE: process.env.FF_CSP_UPGRADE_INSECURE,
    })
  ) {
    cspParts.push("upgrade-insecure-requests");
  }
  const csp = cspParts.join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "Referrer-Policy",
    referrerPolicyForPath(request.nextUrl.pathname),
  );
  response.headers.set("X-Request-Id", requestId);
  // Powerful APIs off (OWASP SHP subset); clipboard left unrestricted for paste/copy UX
  response.headers.set(
    "Permissions-Policy",
    [
      "accelerometer=()",
      "autoplay=()",
      "camera=()",
      "display-capture=()",
      "encrypted-media=()",
      "geolocation=()",
      "gyroscope=()",
      "interest-cohort=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "picture-in-picture=()",
      "publickey-credentials-get=()",
      "screen-wake-lock=()",
      "usb=()",
      "xr-spatial-tracking=()",
    ].join(", "),
  );
  // XS-Leak isolation; no OAuth popup SoR → same-origin (not allow-popups)
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  // Spectre/resource isolation for document responses (not Seaweed signed URLs)
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  // Legacy Flash/Acrobat crossdomain.xml meta-policy — deny all (OWASP SHP)
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  // Origin-keyed process hint (all responses; not a Spectre guarantee)
  response.headers.set("Origin-Agent-Cluster", "?1");
  // Chromium DNS prefetch off — reduce link/domain leakage (OWASP SHP)
  response.headers.set("X-DNS-Prefetch-Control", "off");
  // Private SoR — ask crawlers not to index (not a substitute for auth)
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  // Dynamic SoR / auth surfaces — never store in shared or private HTTP cache
  applyNoStore(response.headers);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
