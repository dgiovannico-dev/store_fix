/**
 * Named windows — keep in sync with `docs/ops/RATE_LIMITS.md`.
 * Store: memory (default) or Postgres via `FF_RATE_LIMIT_STORE` + `checkRateLimitPolicyAsync`.
 */
export type RateLimitPolicy = {
  readonly limit: number;
  readonly windowMs: number;
};

const MIN15 = 15 * 60 * 1000;

export const RATE_LIMIT = {
  /** Per-IP login attempts (credential stuffing sweep). */
  login: { limit: 10, windowMs: MIN15 },
  /** Per-email login attempts (targeted account spray). Independent of IP. */
  loginUser: { limit: 10, windowMs: MIN15 },
  logout: { limit: 20, windowMs: MIN15 },
  /** Per-IP signup (workspace spam). */
  signup: { limit: 10, windowMs: MIN15 },
  /** Per-email signup — independent of IP (distributed create attempts). */
  signupUser: { limit: 5, windowMs: MIN15 },
  pwdreset: { limit: 5, windowMs: MIN15 },
  storeCsv: { limit: 5, windowMs: MIN15 },
  intake: { limit: 20, windowMs: MIN15 },
  /** Suggest category / vendor / summarize — stesso budget assist AI. */
  aiSuggest: { limit: 20, windowMs: 60_000 },
  inboundEmail: { limit: 60, windowMs: 60_000 },
  /** Full-tenant GDPR JSON — rare, expensive. */
  gdprExport: { limit: 3, windowMs: MIN15 },
  /** Accounting CSV download — HQ/finance refresh. */
  accountingExport: { limit: 10, windowMs: MIN15 },
  /** Attachment presign mint — blocks storage abuse; allows multi-photo bursts. */
  attachmentPresign: { limit: 40, windowMs: MIN15 },
  /** Signed GET URL mint for attachments. */
  attachmentUrl: { limit: 60, windowMs: MIN15 },
  /** NotificationBell poll (30s) + list/mark-read — shared per user. */
  notifications: { limit: 60, windowMs: 60_000 },
  /** New-ticket form stores/assets options (DB list). */
  formOptions: { limit: 30, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitPolicy>;

export type RateLimitPolicyName = keyof typeof RATE_LIMIT;
