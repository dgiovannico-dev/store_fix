import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { signOut } from "@/auth";
import { applyLogoutClearSiteData } from "@/infrastructure/security/session-cleanup-headers";

/**
 * Explicit logout endpoint: revoke DB session via Auth.js, then instruct the
 * browser to drop cache/cookies/storage (HTTPS). Prefer this over inline signOut
 * so Clear-Site-Data can be set on the redirect response.
 */
async function logoutAndRedirect(request: NextRequest) {
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
