import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static gate: Auth.js jwt callback wires opt-in idle timeout helpers.
 * @see docs/ops/AUTH.md · https://authjs.dev/reference/core#jwt
 */
describe("auth session idle wiring", () => {
  const raw = readFileSync(path.join(process.cwd(), "src/auth.ts"), "utf8");

  it("importa helper da session-idle", () => {
    expect(raw).toMatch(/resolveSessionIdleSec/);
    expect(raw).toMatch(/isSessionIdleExpired/);
    expect(raw).toMatch(/nextLastActiveAt/);
    expect(raw).toMatch(/@\/infrastructure\/auth\/session-idle/);
  });

  it("imposta lastActiveAt al login e lo aggiorna nel jwt callback", () => {
    expect(raw).toMatch(/lastActiveAt:\s*nowSec/);
    expect(raw).toMatch(/lastActiveAt:\s*nextLastActiveAt\s*\(/);
    expect(raw).toMatch(/isSessionIdleExpired\s*\(/);
  });

  it("su idle scaduto cancella Session DB e svuota JWT", () => {
    expect(raw).toMatch(/prisma\.session[\s\S]*?\.delete/);
    expect(raw).toMatch(/emptyJwt\s*\(/);
  });
});
