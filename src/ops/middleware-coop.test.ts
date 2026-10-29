import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static gate: COOP same-origin on Next middleware (XS-Leak).
 * Runtime smoke: `scripts/verify-security-headers.sh`.
 * @see docs/ops/SECURITY_HEADERS.md
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy
 */
describe("middleware Cross-Origin-Opener-Policy", () => {
  const raw = readFileSync(
    path.join(process.cwd(), "src/middleware.ts"),
    "utf8",
  );

  it("imposta COOP same-origin", () => {
    expect(raw).toMatch(
      /["']Cross-Origin-Opener-Policy["']\s*,\s*["']same-origin["']/,
    );
  });
});
