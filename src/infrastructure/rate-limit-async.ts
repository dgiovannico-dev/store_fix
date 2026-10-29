import {
  checkRateLimitPolicy,
  type RateLimitResult,
} from "@/infrastructure/rate-limit";
import type { RateLimitPolicy } from "@/infrastructure/rate-limit-policies";
import { checkRateLimitPostgres } from "@/infrastructure/rate-limit-postgres";
import { resolveRateLimitStore } from "@/infrastructure/rate-limit-store";

/**
 * Async entry for route handlers that can use Postgres when configured.
 * Server Actions that stay sync should keep `checkRateLimitPolicy` (memory).
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
