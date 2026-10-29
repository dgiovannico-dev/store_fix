import { describe, expect, it } from "vitest";
import { RATE_LIMIT } from "./rate-limit-policies";

describe("RATE_LIMIT policies", () => {
  it("allinea login/logout/intake alle finestre documentate", () => {
    expect(RATE_LIMIT.login).toEqual({ limit: 10, windowMs: 15 * 60 * 1000 });
    expect(RATE_LIMIT.logout).toEqual({ limit: 20, windowMs: 15 * 60 * 1000 });
    expect(RATE_LIMIT.intake).toEqual({ limit: 20, windowMs: 15 * 60 * 1000 });
    expect(RATE_LIMIT.aiSuggest).toEqual({ limit: 20, windowMs: 60_000 });
    expect(RATE_LIMIT.inboundEmail).toEqual({ limit: 60, windowMs: 60_000 });
    expect(RATE_LIMIT.gdprExport).toEqual({ limit: 3, windowMs: 15 * 60 * 1000 });
    expect(RATE_LIMIT.accountingExport).toEqual({
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    expect(RATE_LIMIT.attachmentPresign).toEqual({
      limit: 40,
      windowMs: 15 * 60 * 1000,
    });
  });
});
