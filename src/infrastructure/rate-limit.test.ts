import { beforeEach, describe, expect, it } from "vitest";
import { _resetRateLimitForTests, checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => _resetRateLimitForTests());

  it("blocca oltre il limite nella finestra", () => {
    const key = "login:test";
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 60_000).ok).toBe(true);
    }
    expect(checkRateLimit(key, 3, 60_000).ok).toBe(false);
  });
});
