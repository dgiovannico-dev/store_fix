import { describe, expect, it } from "vitest";
import { SESSION_MAX_AGE_SEC } from "@/infrastructure/auth/session-max-age";

/** Gate: absolute session lifetime stays documented 30d unless product changes. */
describe("SESSION_MAX_AGE_SEC", () => {
  it("è 30 giorni", () => {
    expect(SESSION_MAX_AGE_SEC).toBe(30 * 24 * 60 * 60);
  });
});
