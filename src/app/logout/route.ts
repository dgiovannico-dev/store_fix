import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { signOut } from "@/auth";
import { checkRateLimit } from "@/infrastructure/rate-limit";
import { applyLogoutClearSiteData } from "@/infrastructure/security/session-cleanup-headers";

const LOGOUT_LIMIT = 20;
const LOGOUT_WINDOW_MS = 15 * 60 * 1000;

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || request.headers.get("x-real-ip") || "local";
}

/**
 * Explicit logout endpoint: revoke DB session via Auth.js, then instruct the
 * browser to drop cache/cookies/storage (HTTPS). Prefer this over inline signOut
 * so Clear-Site-Data can be set on the redirect response.
 */
async function logoutAndRedirect(request: NextRequest) {
  const limit = checkRateLimit(
    `logout:${clientIp(request)}`,
    LOGOUT_LIMIT,
    LOGOUT_WINDOW_MS,
  );
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests", code: "rate_limited", retryAfterSec: limit.retryAfterSec },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSec),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  await signOut({ redirect: false });
  const res = NextResponse.redirect(new URL("/login", request.url));
  applyLogoutClearSiteData(res.headers);
  return res;
}

export async function GET(request: NextRequest) {
  return logoutAndRedirect(request);
}

export async function POST(request: NextRequest) {
  return logoutAndRedirect(request);
}
