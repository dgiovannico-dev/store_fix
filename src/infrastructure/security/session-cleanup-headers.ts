/**
 * Browser cache / client storage cleanup for auth surfaces (OWASP session + cache).
 * Clear-Site-Data is ignored on non-secure contexts (HTTP lab); still set for HTTPS.
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Clear-Site-Data
 */

export const CACHE_CONTROL_NO_STORE = "no-store";

/** Quoted-string grammar required by Clear-Site-Data. */
export const CLEAR_SITE_DATA_ON_LOGOUT = '"cache", "cookies", "storage"';

export function applyNoStore(headers: Headers): void {
  headers.set("Cache-Control", CACHE_CONTROL_NO_STORE);
}

export function applyLogoutClearSiteData(headers: Headers): void {
  headers.set("Clear-Site-Data", CLEAR_SITE_DATA_ON_LOGOUT);
  applyNoStore(headers);
}

/** Auth.js sign-out paths under `/api/auth/*`. */
export function isAuthJsSignOutPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return (
    p === "/api/auth/signout" ||
    p.endsWith("/api/auth/signout") ||
    /\/api\/auth\/signout$/i.test(p)
  );
}
