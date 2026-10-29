import {
  checkRateLimitPolicy,
  type RateLimitResult,
} from "@/infrastructure/rate-limit";
import type { RateLimitPolicy } from "@/infrastructure/rate-limit-policies";
import { checkRateLimitPostgres } from "@/infrastructure/rate-limit-postgres";
import { resolveRateLimitStore } from "@/infrastructure/rate-limit-store";

/**
 * Async entry for all rate-limited surfaces (routes + Server Actions + domain).
 * Honours `FF_RATE_LIMIT_STORE=postgres` for multi-replica shared buckets.
 */
export async function checkRateLimitPolicyAsync(
  key: string,
  policy: RateLimitPolicy,
  now = Date.now(),
): Promise<RateLimitResult> {
  if (resolveRateLimitStore() === "postgres") {
    return checkRateLimitPostgres(key, policy.limit, policy.windowMs, undefined, now);
  }
  return checkRateLimitPolicy(key, policy, now);
}
