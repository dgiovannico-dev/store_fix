import type { NextConfig } from "next";
import { resolveServerActionsAllowedOrigins } from "./src/infrastructure/security/server-actions-origins";

const serverActionsAllowedOrigins = resolveServerActionsAllowedOrigins({
  SERVER_ACTIONS_ALLOWED_ORIGINS: process.env.SERVER_ACTIONS_ALLOWED_ORIGINS,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  FF_DOMAIN: process.env.FF_DOMAIN,
});

const nextConfig: NextConfig = {
  // @sentry/node uses node: protocol imports — must stay external to webpack.
  serverExternalPackages: [
    "@sentry/node",
    "@sentry/core",
    "@sentry/opentelemetry",
    "@sentry/server-runtime-injection",
    "@sentry/server-utils",
    "@opentelemetry/api",
  ],
  /**
   * Extra hosts for Server Action CSRF when public Origin ≠ internal Host
   * (Caddy / tunnel). Empty on localhost lab — Next same-origin check suffices.
   * @see docs/ops/SECURITY_HEADERS.md
   */
  ...(serverActionsAllowedOrigins.length > 0
    ? { experimental: { serverActions: { allowedOrigins: serverActionsAllowedOrigins } } }
    : {}),
};

export default nextConfig;
