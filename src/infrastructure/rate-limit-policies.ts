/**
 * Named windows — keep in sync with `docs/ops/RATE_LIMITS.md`.
 * In-process store only (single-node MVP).
 */
export type RateLimitPolicy = {
  readonly limit: number;
  readonly windowMs: number;
};

const MIN15 = 15 * 60 * 1000;

export const RATE_LIMIT = {
  login: { limit: 10, windowMs: MIN15 },
  logout: { limit: 20, windowMs: MIN15 },
  signup: { limit: 10, windowMs: MIN15 },
  pwdreset: { limit: 5, windowMs: MIN15 },
  storeCsv: { limit: 5, windowMs: MIN15 },
  intake: { limit: 20, windowMs: MIN15 },
  /** Suggest category / vendor / summarize — stesso budget assist AI. */
  aiSuggest: { limit: 20, windowMs: 60_000 },
  inboundEmail: { limit: 60, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitPolicy>;

export type RateLimitPolicyName = keyof typeof RATE_LIMIT;
