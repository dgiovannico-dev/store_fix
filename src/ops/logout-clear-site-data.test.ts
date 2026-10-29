import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static gate: logout route + Auth.js signout wrap set Clear-Site-Data.
 * @see docs/ops/AUTH.md
 */
describe("logout Clear-Site-Data wiring", () => {
  it("route /logout applies applyLogoutClearSiteData", () => {
    const raw = readFileSync(
      path.join(process.cwd(), "src/app/logout/route.ts"),
      "utf8",
    );
    expect(raw).toMatch(/applyLogoutClearSiteData/);
    expect(raw).toMatch(/signOut\s*\(/);
  });

  it("Auth.js POST signout applies Clear-Site-Data", () => {
    const raw = readFileSync(
      path.join(process.cwd(), "src/app/api/auth/[...nextauth]/route.ts"),
      "utf8",
    );
    expect(raw).toMatch(/isAuthJsSignOutPath/);
    expect(raw).toMatch(/applyLogoutClearSiteData/);
  });
});
