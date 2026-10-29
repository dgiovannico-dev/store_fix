/**
 * Client IP for rate-limit keys (not audit legal identity).
 * Prefer `X-Real-IP` (edge-set). Else `X-Forwarded-For` from the **right**
 * (first hop added by a trusted proxy) — leftmost is client-spoofable.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For
 * @see https://adam-p.ca/blog/2022/03/x-forwarded-for/
 */

export type ClientIpEnv = {
  FF_TRUSTED_PROXY_COUNT?: string | null;
};

export function clientIpFromHeaders(
  headers: Headers,
  env?: ClientIpEnv,
): string {
  const cfg = env ?? {
    FF_TRUSTED_PROXY_COUNT: process.env.FF_TRUSTED_PROXY_COUNT,
  };
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return "local";

    const raw = cfg.FF_TRUSTED_PROXY_COUNT ?? "1";
    const trustCount = Number(raw);
    const n =
      Number.isFinite(trustCount) && trustCount >= 1
        ? Math.floor(trustCount)
        : 1;
    const idx = Math.max(0, parts.length - n);
    return parts[idx]!;
  }

  return "local";
}

export function rateLimitKey(prefix: string, headers: Headers): string {
  return `${prefix}:${clientIpFromHeaders(headers)}`;
}
