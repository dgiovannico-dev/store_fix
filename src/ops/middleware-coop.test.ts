import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static gate: COOP + CORP + XPCDP on Next middleware.
 * Runtime smoke: `scripts/verify-security-headers.sh`.
 * @see docs/ops/SECURITY_HEADERS.md
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Permitted-Cross-Domain-Policies
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

  it("imposta X-Permitted-Cross-Domain-Policies none", () => {
    expect(raw).toMatch(
      /["']X-Permitted-Cross-Domain-Policies["']\s*,\s*["']none["']/,
    );
  });

  it("espande Permissions-Policy (payment/usb/topics off)", () => {
    expect(raw).toMatch(/payment=\(\)/);
    expect(raw).toMatch(/usb=\(\)/);
    expect(raw).toMatch(/interest-cohort=\(\)/);
    expect(raw).toMatch(/browsing-topics=\(\)/);
  });

  it("imposta Origin-Agent-Cluster ?1", () => {
    expect(raw).toMatch(
      /["']Origin-Agent-Cluster["']\s*,\s*["']\?1["']/,
    );
  });

  it("applica Cache-Control no-store via applyNoStore", () => {
    expect(raw).toMatch(/applyNoStore\s*\(\s*response\.headers\s*\)/);
  });

  it("CSP object-src e base-uri none", () => {
    expect(raw).toMatch(/object-src 'none'/);
    expect(raw).toMatch(/base-uri 'none'/);
  });

  it("condiziona upgrade-insecure-requests via shouldUpgradeInsecureRequests", () => {
    expect(raw).toMatch(/shouldUpgradeInsecureRequests/);
    expect(raw).toMatch(/upgrade-insecure-requests/);
  });

  it("usa referrerPolicyForPath", () => {
    expect(raw).toMatch(/referrerPolicyForPath/);
  });

  it("imposta X-DNS-Prefetch-Control off", () => {
    expect(raw).toMatch(
      /["']X-DNS-Prefetch-Control["']\s*,\s*["']off["']/,
    );
  });

  it("imposta X-Robots-Tag noindex, nofollow", () => {
    expect(raw).toMatch(
      /["']X-Robots-Tag["']\s*,\s*["']noindex, nofollow["']/,
    );
  });
});
