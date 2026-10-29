import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static gate: expensive export/presign routes wire named RATE_LIMIT policies.
 * @see docs/ops/RATE_LIMITS.md
 */
describe("rate-limit exports + presign wiring", () => {
  const root = process.cwd();

  it("gdpr export usa gdprExport", () => {
    const raw = readFileSync(
      path.join(root, "src/app/api/gdpr/export/route.ts"),
      "utf8",
    );
    expect(raw).toMatch(/checkRateLimitPolicyAsync/);
    expect(raw).toMatch(/RATE_LIMIT\.gdprExport/);
    expect(raw).toMatch(/gdpr-export:/);
  });

  it("accounting export usa accountingExport", () => {
    const raw = readFileSync(
      path.join(root, "src/app/api/exports/accounting/route.ts"),
      "utf8",
    );
    expect(raw).toMatch(/checkRateLimitPolicyAsync/);
    expect(raw).toMatch(/RATE_LIMIT\.accountingExport/);
    expect(raw).toMatch(/accounting-export:/);
  });

  it("attachment presign usa attachmentPresign", () => {
    const raw = readFileSync(
      path.join(
        root,
        "src/app/api/tickets/[id]/attachments/presign/route.ts",
      ),
      "utf8",
    );
    expect(raw).toMatch(/checkRateLimitPolicyAsync/);
    expect(raw).toMatch(/RATE_LIMIT\.attachmentPresign/);
    expect(raw).toMatch(/attachment-presign:/);
  });
});
