import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static gate: COOP + CORP same-origin on Next middleware.
 * Runtime smoke: `scripts/verify-security-headers.sh`.
 * @see docs/ops/SECURITY_HEADERS.md
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy
 */
describe("middleware cross-origin isolation headers", () => {
  const raw = readFileSync(
    path.join(process.cwd(), "src/middleware.ts"),
    "utf8",
  );

  it("imposta COOP same-origin", () => {
    expect(raw).toMatch(
      /["']Cross-Origin-Opener-Policy["']\s*,\s*["']same-origin["']/,
    );
  });

  it("imposta CORP same-origin", () => {
    expect(raw).toMatch(
      /["']Cross-Origin-Resource-Policy["']\s*,\s*["']same-origin["']/,
    );
  });
});
