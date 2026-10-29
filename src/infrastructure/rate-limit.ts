import type { RateLimitPolicy } from "@/infrastructure/rate-limit-policies";

/**
 * Rate limit in-process (OSS, zero Redis) — sufficiente per MVP single-node.
 * Policy nominate: `rate-limit-policies.ts` · 429 JSON: `rate-limit-response.ts`.
 * Chiave tipica: `login:ip` / `signup:ip`.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

export function checkRateLimitPolicy(
  key: string,
  policy: RateLimitPolicy,
  now = Date.now(),
): RateLimitResult {
  return checkRateLimit(key, policy.limit, policy.windowMs, now);
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    retryAfterSec: Math.ceil((existing.resetAt - now) / 1000),
  };
}

/** Solo test */
export function _resetRateLimitForTests(): void {
  buckets.clear();
}
