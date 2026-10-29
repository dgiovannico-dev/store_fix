import { shouldUpgradeInsecureRequests } from "@/infrastructure/security/csp-upgrade";

/**
 * FacilityFlow CSP baseline for Next.js App Router + Tailwind inline + Seaweed signed URLs.
 * Nonce/`strict-dynamic` deferred (forces dynamic render on all pages) — MVP keeps unsafe-inline.
 * @see https://nextjs.org/docs/app/guides/content-security-policy
 * @see docs/ops/SECURITY_HEADERS.md
 */
export type CspPolicyEnv = {
  NODE_ENV?: string;
  FF_DOMAIN?: string | null;
  FF_CSP_UPGRADE_INSECURE?: string | null;
};

export function buildContentSecurityPolicy(env: CspPolicyEnv = {}): string {
  const isProd = (env.NODE_ENV ?? process.env.NODE_ENV) === "production";
  const scriptSrc = isProd
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  const parts = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: http: https:",
    "font-src 'self' data:",
    "connect-src 'self' http: https:",
    "object-src 'none'",
    "frame-src 'none'",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ];

  if (
    shouldUpgradeInsecureRequests({
      NODE_ENV: env.NODE_ENV ?? process.env.NODE_ENV,
      FF_DOMAIN: env.FF_DOMAIN,
      FF_CSP_UPGRADE_INSECURE: env.FF_CSP_UPGRADE_INSECURE,
    })
  ) {
    parts.push("upgrade-insecure-requests");
  }

  return parts.join("; ");
}
