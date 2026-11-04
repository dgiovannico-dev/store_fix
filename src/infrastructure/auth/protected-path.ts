/**
 * Path che richiedono sessione Auth.js (fail-closed).
 * Public: login/signup/invite/reset/verify, /api/auth, health, inbound bearer, static.
 */
export function requiresAuthSession(pathname: string): boolean {
  if (pathname === "/app" || pathname.startsWith("/app/")) return true;
  if (pathname === "/vendor" || pathname.startsWith("/vendor/")) return true;
  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    return true;
  }
  return false;
}

export function sessionCookieNames(secure: boolean): string[] {
  return secure
    ? ["__Secure-authjs.session-token", "authjs.session-token"]
    : ["authjs.session-token", "__Secure-authjs.session-token"];
}

export function hasSessionCookie(
  cookieHeader: string | null,
  secure: boolean,
): boolean {
  if (!cookieHeader) return false;
  const names = sessionCookieNames(secure);
  return names.some(
    (name) =>
      cookieHeader.includes(`${name}=`) &&
      !cookieHeader.includes(`${name}=;`),
  );
}
