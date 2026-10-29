/**
 * When to set Auth.js session cookie `Secure` + `__Secure-` name prefix.
 * Prefer HTTPS URL / real edge domain — not bare `NODE_ENV=production` (HTTP lab `next start`).
 * @see https://authjs.dev/reference/core#usesecurecookies
 * @see docs/ops/AUTH.md
 */
export type SecureCookiesEnv = {
  NODE_ENV?: string;
  AUTH_URL?: string | null;
  NEXT_PUBLIC_APP_URL?: string | null;
  FF_DOMAIN?: string | null;
  /** Force on (`1`) / off (`0`); otherwise infer. */
  AUTH_SECURE_COOKIES?: string | null;
};

function urlLooksHttps(raw: string | null | undefined): boolean {
  const s = (raw ?? "").trim();
  if (!s) return false;
  try {
    return new URL(s).protocol === "https:";
  } catch {
    return false;
  }
}

function realEdgeDomain(domain: string | null | undefined): boolean {
  const d = (domain ?? "").trim().toLowerCase();
  if (!d || d === "localhost" || d.endsWith(".localhost")) return false;
  return true;
}

export function shouldUseSecureAuthCookies(env: SecureCookiesEnv): boolean {
  if (env.AUTH_SECURE_COOKIES === "0") return false;
  if (env.AUTH_SECURE_COOKIES === "1") return true;
  if (urlLooksHttps(env.AUTH_URL) || urlLooksHttps(env.NEXT_PUBLIC_APP_URL)) {
    return true;
  }
  if (env.NODE_ENV === "production" && realEdgeDomain(env.FF_DOMAIN)) {
    return true;
  }
  return false;
}

/** Auth.js sessionToken cookie name + options aligned with Secure policy. */
export function sessionTokenCookie(secure: boolean) {
  return {
    name: secure ? "__Secure-authjs.session-token" : "authjs.session-token",
    options: {
      httpOnly: true as const,
      sameSite: "lax" as const,
      path: "/",
      secure,
    },
  };
}
