import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimitPolicyAsync } from "./rate-limit-async";
import { RATE_LIMIT } from "./rate-limit-policies";
import { _resetRateLimitForTests } from "./rate-limit";

describe("checkRateLimitPolicyAsync (memory)", () => {
  beforeEach(() => {
    _resetRateLimitForTests();
    delete process.env.FF_RATE_LIMIT_STORE;
  });

  it("usa store memory di default", async () => {
    const key = `login:async-test-${Date.now()}`;
    for (let i = 0; i < RATE_LIMIT.login.limit; i++) {
      expect((await checkRateLimitPolicyAsync(key, RATE_LIMIT.login)).ok).toBe(
        true,
      );
    }
    expect((await checkRateLimitPolicyAsync(key, RATE_LIMIT.login)).ok).toBe(
      false,
    );
  });
});
