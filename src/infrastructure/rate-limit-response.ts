import { NextResponse } from "next/server";
import type { RateLimitResult } from "@/infrastructure/rate-limit";

/**
 * JSON 429 with Retry-After (RFC 6585) + no-store.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After
 */
export function tooManyRequestsJson(
  error: string,
  retryAfterSec: number,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    { error, code: "rate_limited", retryAfterSec, ...extra },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "Cache-Control": "no-store",
      },
    },
  );
}

export function tooManyRequestsFromLimit(
  error: string,
  limit: Pick<RateLimitResult, "retryAfterSec">,
  extra?: Record<string, unknown>,
): NextResponse {
  return tooManyRequestsJson(error, limit.retryAfterSec, extra);
}
