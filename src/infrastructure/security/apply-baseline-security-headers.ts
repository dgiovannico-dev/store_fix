import { buildContentSecurityPolicy } from "@/infrastructure/security/csp-policy";
import { buildPermissionsPolicyHeader } from "@/infrastructure/security/permissions-policy";
import { referrerPolicyForPath } from "@/infrastructure/security/referrer-policy";
import { applyNoStore } from "@/infrastructure/security/session-cleanup-headers";

export type BaselineSecurityHeaderEnv = {
  NODE_ENV?: string;
  FF_DOMAIN?: string | null;
  FF_CSP_UPGRADE_INSECURE?: string | null;
};

/**
 * OWASP SHP subset for FacilityFlow SoR responses (US-E10-07 / T4.6).
 * CSRF is gated separately in middleware before this runs.
 * @see docs/ops/SECURITY_HEADERS.md
 */
export function applyBaselineSecurityHeaders(
  headers: Headers,
  opts: {
    pathname: string;
    requestId: string;
    env?: BaselineSecurityHeaderEnv;
  },
): void {
  const env = opts.env ?? {};
  headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy({
      NODE_ENV: env.NODE_ENV,
      FF_DOMAIN: env.FF_DOMAIN,
      FF_CSP_UPGRADE_INSECURE: env.FF_CSP_UPGRADE_INSECURE,
    }),
  );
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", referrerPolicyForPath(opts.pathname));
  headers.set("X-Request-Id", opts.requestId);
  headers.set("Permissions-Policy", buildPermissionsPolicyHeader());
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set("Origin-Agent-Cluster", "?1");
  headers.set("X-DNS-Prefetch-Control", "off");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  applyNoStore(headers);
}
