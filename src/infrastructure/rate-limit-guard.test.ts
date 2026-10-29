import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/rate-limit-async", () => ({
  checkRateLimitPolicyAsync: vi.fn(),
}));
vi.mock("@/i18n/action-errors", () => ({
  actionError: vi.fn(async () => "Troppe richieste"),
}));

import { checkRateLimitPolicyAsync } from "@/infrastructure/rate-limit-async";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { rejectIfRateLimited } from "./rate-limit-guard";

const mocked = vi.mocked(checkRateLimitPolicyAsync);

describe("rejectIfRateLimited", () => {
  beforeEach(() => {
    mocked.mockReset();
  });

  it("restituisce null se ok", async () => {
    mocked.mockResolvedValue({ ok: true, remaining: 1, retryAfterSec: 0 });
    await expect(
      rejectIfRateLimited("k", RATE_LIMIT.notifications),
    ).resolves.toBeNull();
  });

  it("restituisce 429 con Retry-After se esausto", async () => {
    mocked.mockResolvedValue({
      ok: false,
      remaining: 0,
      retryAfterSec: 42,
    });
    const res = await rejectIfRateLimited("k", RATE_LIMIT.notifications);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    expect(res!.headers.get("Retry-After")).toBe("42");
  });
});
