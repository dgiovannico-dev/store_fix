/**
 * `upgrade-insecure-requests` only when serving real HTTPS edge (FF_DOMAIN set).
 * Skip for local `next start` / Compose HTTP lab so Seaweed/Mailpit `http://` URLs keep working.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/upgrade-insecure-requests
 */
export function shouldUpgradeInsecureRequests(env: {
  NODE_ENV?: string;
  FF_DOMAIN?: string | null;
  FF_CSP_UPGRADE_INSECURE?: string | null;
}): boolean {
  if (env.FF_CSP_UPGRADE_INSECURE === "0") return false;
  if (env.FF_CSP_UPGRADE_INSECURE === "1") return true;
  if (env.NODE_ENV !== "production") return false;
  const domain = (env.FF_DOMAIN ?? "").trim().toLowerCase();
  if (!domain || domain === "localhost" || domain.endsWith(".localhost")) {
    return false;
  }
  return true;
}
