import { describe, expect, it } from "vitest";
import { resolveRateLimitStore } from "./rate-limit-store";

describe("resolveRateLimitStore", () => {
  it("default memory", () => {
    expect(resolveRateLimitStore({})).toBe("memory");
    expect(resolveRateLimitStore({ FF_RATE_LIMIT_STORE: "" })).toBe("memory");
    expect(resolveRateLimitStore({ FF_RATE_LIMIT_STORE: "redis" })).toBe(
      "memory",
    );
  });

  it("postgres solo se esplicito", () => {
    expect(resolveRateLimitStore({ FF_RATE_LIMIT_STORE: "postgres" })).toBe(
      "postgres",
    );
    expect(resolveRateLimitStore({ FF_RATE_LIMIT_STORE: "Postgres" })).toBe(
      "postgres",
    );
  });
});
