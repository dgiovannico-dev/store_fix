import type { NextResponse } from "next/server";
import { checkRateLimitPolicyAsync } from "@/infrastructure/rate-limit-async";
import type { RateLimitPolicy } from "@/infrastructure/rate-limit-policies";
import { tooManyRequestsFromLimit } from "@/infrastructure/rate-limit-response";
import { actionError } from "@/i18n/action-errors";

/**
 * Returns a 429 NextResponse when the named policy bucket is exhausted; otherwise null.
 * Shared by JSON API routes (Retry-After + IT copy). Optional `error` overrides catalog copy
 * (e.g. logout English fallback).
 */
export async function rejectIfRateLimited(
  key: string,
  policy: RateLimitPolicy,
  error?: string,
): Promise<NextResponse | null> {
  const limit = await checkRateLimitPolicyAsync(key, policy);
  if (limit.ok) return null;
  const message = error ?? (await actionError("tooManyRequests"));
  return tooManyRequestsFromLimit(message, limit);
}
