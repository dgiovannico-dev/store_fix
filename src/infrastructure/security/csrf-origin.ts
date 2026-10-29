/**
 * Defense-in-depth CSRF for mutating `/api/*` (OWASP Fetch Metadata + Origin).
 * Server Actions already get Next.js Origin/Host checks; route handlers need this.
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 * @see https://nextjs.org/blog/security-nextjs-server-components-actions
 */

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export type CsrfDecision =
  | { allow: true }
  | { allow: false; reason: "sec-fetch-site-cross-site" | "invalid-origin" | "origin-mismatch" };

function normalizePath(pathname: string): string {
  const p = pathname.replace(/\/+$/, "") || "/";
  return p;
}

/**
 * Paths exempt from Origin / Sec-Fetch-Site CSRF gate.
 * Non-API pages are exempt except mutating session handlers (`/logout`).
 * API exemptions: Bearer webhooks, Auth.js, health.
 */
export function isCsrfExemptApiPath(pathname: string): boolean {
  const p = normalizePath(pathname);
  if (p === "/logout") return false;
  if (!pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/api/health")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/api/inbound/")) return true;
  return false;
}

/**
 * Parse comma-separated hosts (host or host:port) for proxy/tunnel allowlists.
 * Accepts bare hosts or full origins (https://app.example.com → app.example.com).
 */
export function parseAllowedHosts(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const t = part.trim();
    if (!t) continue;
    try {
      if (t.includes("://")) {
        out.push(new URL(t).host);
      } else {
        out.push(t);
      }
    } catch {
      /* skip invalid */
    }
  }
  return out;
}

function firstHostHeader(value: string | null): string | null {
  if (!value) return null;
  return value.split(",")[0]!.trim() || null;
}

export function evaluateApiCsrf(input: {
  method: string;
  pathname: string;
  origin: string | null;
  secFetchSite: string | null;
  /** `Host` or `X-Forwarded-Host` (may be comma-separated). */
  requestHost: string | null;
  /** Extra trusted hosts (Caddy public name when internal Host differs). */
  allowedHosts?: readonly string[];
}): CsrfDecision {
  if (!MUTATING.has(input.method.toUpperCase())) return { allow: true };
  if (isCsrfExemptApiPath(input.pathname)) return { allow: true };

  const site = input.secFetchSite?.toLowerCase() ?? null;
  if (site === "cross-site") {
    return { allow: false, reason: "sec-fetch-site-cross-site" };
  }

  if (!input.origin) {
    // curl / server clients / legacy: allow when Sec-Fetch-Site is absent or not cross-site
    return { allow: true };
  }

  let originHost: string;
  try {
    originHost = new URL(input.origin).host;
  } catch {
    return { allow: false, reason: "invalid-origin" };
  }

  const trusted = new Set<string>();
  const rh = firstHostHeader(input.requestHost);
  if (rh) trusted.add(rh);
  for (const h of input.allowedHosts ?? []) {
    if (h) trusted.add(h);
  }

  if (trusted.size === 0 || !trusted.has(originHost)) {
    return { allow: false, reason: "origin-mismatch" };
  }

  return { allow: true };
}
