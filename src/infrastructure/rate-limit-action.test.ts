import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/rate-limit-async", () => ({
  checkRateLimitPolicyAsync: vi.fn(),
}));
vi.mock("@/i18n/action-errors", () => ({
  actionError: vi.fn(async () => "Riprova tra {sec}s"),
}));

import { checkRateLimitPolicyAsync } from "@/infrastructure/rate-limit-async";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import {
  checkActionRateLimit,
  rateLimitedRetryMessage,
} from "./rate-limit-action";

const mocked = vi.mocked(checkRateLimitPolicyAsync);

describe("rate-limit-action helpers", () => {
  beforeEach(() => {
    mocked.mockReset();
  });

  it("checkActionRateLimit ok / hit", async () => {
    mocked.mockResolvedValueOnce({ ok: true, remaining: 1, retryAfterSec: 0 });
    await expect(
      checkActionRateLimit("k", RATE_LIMIT.login),
    ).resolves.toEqual({ limited: false });

    mocked.mockResolvedValueOnce({
      ok: false,
      remaining: 0,
      retryAfterSec: 12,
    });
    await expect(
      checkActionRateLimit("k", RATE_LIMIT.login),
    ).resolves.toEqual({ limited: true, retryAfterSec: 12 });
  });

  it("rateLimitedRetryMessage riempie {sec}", async () => {
    mocked.mockResolvedValue({ ok: true, remaining: 1, retryAfterSec: 0 });
    await expect(
      rateLimitedRetryMessage("k", RATE_LIMIT.signup),
    ).resolves.toBeNull();

    mocked.mockResolvedValue({
      ok: false,
      remaining: 0,
      retryAfterSec: 90,
    });
    await expect(
      rateLimitedRetryMessage("k", RATE_LIMIT.signup),
    ).resolves.toBe("Riprova tra 90s");
  });
});
