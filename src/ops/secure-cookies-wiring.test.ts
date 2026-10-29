import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static gate: Auth.js session cookie Secure policy is wired from secure-cookies.
 * @see docs/ops/AUTH.md · https://authjs.dev/reference/core#usesecurecookies
 */
describe("auth secure cookies wiring", () => {
  const raw = readFileSync(path.join(process.cwd(), "src/auth.ts"), "utf8");

  it("usa shouldUseSecureAuthCookies + sessionTokenCookie", () => {
    expect(raw).toMatch(/@\/infrastructure\/auth\/secure-cookies/);
    expect(raw).toMatch(/shouldUseSecureAuthCookies\s*\(/);
    expect(raw).toMatch(/sessionTokenCookie\s*\(/);
  });

  it("passa env AUTH_URL / FF_DOMAIN / AUTH_SECURE_COOKIES", () => {
    expect(raw).toMatch(/AUTH_URL/);
    expect(raw).toMatch(/FF_DOMAIN/);
    expect(raw).toMatch(/AUTH_SECURE_COOKIES/);
  });
});
