import { redirect } from "next/navigation";
import {
  checkActionRateLimit,
} from "@/infrastructure/rate-limit-action";
import type { RateLimitPolicy } from "@/infrastructure/rate-limit-policies";

/**
 * Login-style Server Action: redirect when exhausted (never returns on hit).
 * Kept separate so `domain/*` can use `rate-limit-action` without next/navigation.
 */
export async function redirectIfRateLimited(
  key: string,
  policy: RateLimitPolicy,
  path: string,
): Promise<void> {
  const hit = await checkActionRateLimit(key, policy);
  if (hit.limited) redirect(path);
}
