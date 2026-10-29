import { checkRateLimitPolicyAsync } from "@/infrastructure/rate-limit-async";
import type { RateLimitPolicy } from "@/infrastructure/rate-limit-policies";
import { actionError } from "@/i18n/action-errors";

export type ActionRateLimitHit = {
  limited: true;
  retryAfterSec: number;
};

export type ActionRateLimitOk = { limited: false };

/**
 * Shared check for Server Actions / RSC / domain that need retryAfterSec.
 * No Next.js imports — safe from `domain/*`.
 */
export async function checkActionRateLimit(
  key: string,
  policy: RateLimitPolicy,
): Promise<ActionRateLimitOk | ActionRateLimitHit> {
  const limit = await checkRateLimitPolicyAsync(key, policy);
  if (limit.ok) return { limited: false };
  return { limited: true, retryAfterSec: limit.retryAfterSec };
}

/**
 * IT catalog copy `rateLimitedRetry` with `{sec}` filled, or null if under limit.
 * Prefer return-value over throw for expected rate-limit outcomes in actions.
 * @see https://nextjs.org/docs/app/getting-started/error-handling
 */
export async function rateLimitedRetryMessage(
  key: string,
  policy: RateLimitPolicy,
): Promise<string | null> {
  const hit = await checkActionRateLimit(key, policy);
  if (!hit.limited) return null;
  const template = await actionError("rateLimitedRetry");
  return template.replaceAll("{sec}", String(hit.retryAfterSec));
}
