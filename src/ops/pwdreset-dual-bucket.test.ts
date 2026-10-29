import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("pwdreset dual-bucket wiring", () => {
  it("requestPasswordReset checka IP + email", () => {
    const raw = readFileSync(
      path.join(process.cwd(), "src/domain/auth/password-reset.ts"),
      "utf8",
    );
    expect(raw).toMatch(/RATE_LIMIT\.pwdresetIp/);
    expect(raw).toMatch(/RATE_LIMIT\.pwdreset/);
    expect(raw).toMatch(/pwdreset-ip/);
    expect(raw).toMatch(/pwdreset:/);
  });

  it("forgot-password passa headers", () => {
    const raw = readFileSync(
      path.join(process.cwd(), "src/app/(auth)/forgot-password/page.tsx"),
      "utf8",
    );
    expect(raw).toMatch(/requestPasswordReset\s*\(/);
    expect(raw).toMatch(/headers\s*\(/);
  });
});
