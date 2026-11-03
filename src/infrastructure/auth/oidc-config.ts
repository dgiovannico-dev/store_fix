/**
 * F4-04 — Keycloak OIDC flags (Auth.js broker).
 * @see docs/ops/KEYCLOAK.md · ADR-0011
 */

export type OidcEnv = {
  AUTH_OIDC_ENABLED?: string | undefined;
  AUTH_CREDENTIALS_ENABLED?: string | undefined;
  AUTH_KEYCLOAK_ID?: string | undefined;
  AUTH_KEYCLOAK_SECRET?: string | undefined;
  AUTH_KEYCLOAK_ISSUER?: string | undefined;
  [key: string]: string | undefined;
};

function truthy(v: string | undefined): boolean {
  if (!v) return false;
  const n = v.trim().toLowerCase();
  return n === "1" || n === "true" || n === "yes" || n === "on";
}

function falsyExplicit(v: string | undefined): boolean {
  if (v === undefined || v === "") return false;
  const n = v.trim().toLowerCase();
  return n === "0" || n === "false" || n === "no" || n === "off";
}

/** OIDC on when flag set and Keycloak client env complete. */
export function isAuthOidcEnabled(env: OidcEnv = process.env): boolean {
  if (!truthy(env.AUTH_OIDC_ENABLED)) return false;
  return Boolean(
    env.AUTH_KEYCLOAK_ID?.trim() &&
      env.AUTH_KEYCLOAK_SECRET?.trim() &&
      env.AUTH_KEYCLOAK_ISSUER?.trim(),
  );
}

/**
 * Credentials (lab/seed). Default on.
 * When OIDC is enabled, default off unless AUTH_CREDENTIALS_ENABLED explicitly on
 * (prod Helm sets 0; lab can keep both during migration).
 */
export function isAuthCredentialsEnabled(env: OidcEnv = process.env): boolean {
  if (falsyExplicit(env.AUTH_CREDENTIALS_ENABLED)) return false;
  if (truthy(env.AUTH_CREDENTIALS_ENABLED)) return true;
  return !isAuthOidcEnabled(env);
}

export function keycloakProviderOptions(env: OidcEnv = process.env): {
  clientId: string;
  clientSecret: string;
  issuer: string;
} {
  return {
    clientId: env.AUTH_KEYCLOAK_ID!.trim(),
    clientSecret: env.AUTH_KEYCLOAK_SECRET!.trim(),
    issuer: env.AUTH_KEYCLOAK_ISSUER!.trim().replace(/\/$/, ""),
  };
}
