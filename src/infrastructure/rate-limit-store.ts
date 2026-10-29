/**
 * Rate-limit store selection.
 * Default `memory` (single-node). Set `FF_RATE_LIMIT_STORE=postgres` for multi-replica
 * behind the same Postgres (advisory lock per key).
 * @see docs/ops/RATE_LIMITS.md
 */
export type RateLimitStoreKind = "memory" | "postgres";

export function resolveRateLimitStore(env?: {
  FF_RATE_LIMIT_STORE?: string | null;
}): RateLimitStoreKind {
  const raw = (
    env?.FF_RATE_LIMIT_STORE ??
    process.env.FF_RATE_LIMIT_STORE ??
    "memory"
  )
    .trim()
    .toLowerCase();
  return raw === "postgres" ? "postgres" : "memory";
}
