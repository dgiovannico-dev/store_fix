import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static gate: middleware delegates baseline headers to applyBaselineSecurityHeaders.
 * Runtime smoke: `scripts/verify-security-headers.sh`.
 * @see docs/ops/SECURITY_HEADERS.md
 */
describe("middleware security header wiring", () => {
  const raw = readFileSync(
    path.join(process.cwd(), "src/middleware.ts"),
    "utf8",
  );

  it("usa applyBaselineSecurityHeaders", () => {
    expect(raw).toMatch(/applyBaselineSecurityHeaders\s*\(/);
  });

  it("mantiene gate CSRF Origin", () => {
    expect(raw).toMatch(/evaluateApiCsrf/);
  });
});
