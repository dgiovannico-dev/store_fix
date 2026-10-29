import type { NextConfig } from "next";

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
};

export default nextConfig;
