/**
 * Tighter Referrer-Policy on auth surfaces (token URLs must not leak via Referer).
 * Avoid blanket `no-referrer` on login/register forms — can null `Origin` and
 * break Server Action / CSRF Origin checks on same-origin POSTs.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
 * @see https://www.rfc-editor.org/rfc/rfc9700
 */

export function referrerPolicyForPath(pathname: string): string {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (
    p.startsWith("/reset-password") ||
    p.startsWith("/verify-email") ||
    p.startsWith("/invite")
  ) {
    return "no-referrer";
  }
  if (p === "/login" || p === "/register" || p === "/logout") {
    return "strict-origin";
  }
  return "strict-origin-when-cross-origin";
}
