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
    expect(raw).toMatch(/rejectIfRateLimited/);
    expect(raw).toMatch(/RATE_LIMIT\.gdprExport/);
    expect(raw).toMatch(/gdpr-export:/);
  });

  it("accounting export usa accountingExport", () => {
    const raw = readFileSync(
      path.join(root, "src/app/api/exports/accounting/route.ts"),
      "utf8",
    );
    expect(raw).toMatch(/rejectIfRateLimited/);
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
    expect(raw).toMatch(/rejectIfRateLimited/);
    expect(raw).toMatch(/RATE_LIMIT\.attachmentPresign/);
    expect(raw).toMatch(/attachment-presign:/);
  });

  it("attachment confirm condivide budget attachmentPresign", () => {
    const raw = readFileSync(
      path.join(
        root,
        "src/app/api/tickets/[id]/attachments/confirm/route.ts",
      ),
      "utf8",
    );
    expect(raw).toMatch(/RATE_LIMIT\.attachmentPresign/);
    expect(raw).toMatch(/attachment-presign:/);
  });

  it("attachment url usa attachmentUrl", () => {
    const raw = readFileSync(
      path.join(
        root,
        "src/app/api/tickets/[id]/attachments/[attachmentId]/url/route.ts",
      ),
      "utf8",
    );
    expect(raw).toMatch(/RATE_LIMIT\.attachmentUrl/);
    expect(raw).toMatch(/attachment-url:/);
  });

  it("notifications* usano notifications", () => {
    for (const rel of [
      "src/app/api/notifications/route.ts",
      "src/app/api/notifications/unread-count/route.ts",
      "src/app/api/notifications/read-all/route.ts",
      "src/app/api/notifications/[id]/read/route.ts",
    ]) {
      const raw = readFileSync(path.join(root, rel), "utf8");
      expect(raw).toMatch(/RATE_LIMIT\.notifications/);
      expect(raw).toMatch(/notifications:/);
    }
  });

  it("form-options usa formOptions", () => {
    const raw = readFileSync(
      path.join(root, "src/app/api/tickets/form-options/route.ts"),
      "utf8",
    );
    expect(raw).toMatch(/rejectIfRateLimited/);
    expect(raw).toMatch(/RATE_LIMIT\.formOptions/);
    expect(raw).toMatch(/form-options:/);
  });
});

