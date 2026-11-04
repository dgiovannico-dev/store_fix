import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * OWASP: logout UI reachable from authenticated chrome (HQ sidebar + phone).
 * Topbar dashboard keeps bell only; Esci lives in shell chrome.
 * @see docs/ops/AUTH.md
 */
describe("AppChrome logout control", () => {
  it("passa signOutLabel e shells espongono form POST /logout", () => {
    const chrome = readFileSync(
      path.join(process.cwd(), "src/components/shell/app-chrome.tsx"),
      "utf8",
    );
    expect(chrome).toMatch(/signOutLabel=\{msg\.nav\.signOut\}/);

    for (const file of [
      "src/components/shell/hq-shell.tsx",
      "src/components/shell/phone-shell.tsx",
    ]) {
      const raw = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(raw).toMatch(/action=["']\/logout["']/);
      expect(raw).toMatch(/method=["']post["']/);
    }
  });
});
