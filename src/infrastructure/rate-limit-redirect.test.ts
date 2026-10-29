import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/rate-limit-async", () => ({
  checkRateLimitPolicyAsync: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

import { checkRateLimitPolicyAsync } from "@/infrastructure/rate-limit-async";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { redirect } from "next/navigation";
import { redirectIfRateLimited } from "./rate-limit-redirect";

const mocked = vi.mocked(checkRateLimitPolicyAsync);
const mockedRedirect = vi.mocked(redirect);

describe("redirectIfRateLimited", () => {
  beforeEach(() => {
    mocked.mockReset();
    mockedRedirect.mockClear();
  });

  it("non redirige se ok", async () => {
    mocked.mockResolvedValue({ ok: true, remaining: 1, retryAfterSec: 0 });
    await expect(
      redirectIfRateLimited("k", RATE_LIMIT.login, "/login?error=RateLimit"),
    ).resolves.toBeUndefined();
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("redirige se esausto", async () => {
    mocked.mockResolvedValue({
      ok: false,
      remaining: 0,
      retryAfterSec: 1,
    });
    await expect(
      redirectIfRateLimited("k", RATE_LIMIT.login, "/login?error=RateLimit"),
    ).rejects.toThrow("REDIRECT:/login?error=RateLimit");
  });
});
