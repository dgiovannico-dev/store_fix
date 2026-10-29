import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * OWASP: logout UI reachable from authenticated chrome (HQ + vendor layouts).
 * @see docs/ops/AUTH.md
 */
describe("AppChrome logout control", () => {
  it("espone form POST /logout con label nav.signOut", () => {
    const raw = readFileSync(
      path.join(process.cwd(), "src/components/shell/app-chrome.tsx"),
      "utf8",
    );
    expect(raw).toMatch(/action=["']\/logout["']/);
    expect(raw).toMatch(/method=["']post["']/);
    expect(raw).toMatch(/msg\.nav\.signOut/);
  });
});
