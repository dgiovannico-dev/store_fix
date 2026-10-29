/**
 * Host allowlist for Next.js `serverActions.allowedOrigins` (CSRF when
 * X-Forwarded-Host ≠ browser Origin, e.g. misconfigured proxy / tunnel).
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions
 */

import { parseAllowedHosts } from "./csrf-origin";

export function resolveServerActionsAllowedOrigins(env: {
  SERVER_ACTIONS_ALLOWED_ORIGINS?: string;
  NEXT_PUBLIC_APP_URL?: string;
  FF_DOMAIN?: string;
}): string[] {
  const explicit = parseAllowedHosts(env.SERVER_ACTIONS_ALLOWED_ORIGINS);
  if (explicit.length > 0) return [...new Set(explicit)];

  const derived: string[] = [];
  if (env.NEXT_PUBLIC_APP_URL) {
    try {
      const host = new URL(env.NEXT_PUBLIC_APP_URL).host;
      if (host && !isLoopbackHost(host)) derived.push(host);
    } catch {
      /* ignore */
    }
  }
  const domain = env.FF_DOMAIN?.trim();
  if (domain && domain !== "localhost" && !isLoopbackHost(domain)) {
    derived.push(domain);
  }
  return [...new Set(derived)];
}

function isLoopbackHost(host: string): boolean {
  const h = host.split(":")[0]!.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
}
