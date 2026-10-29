import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** Gate: runtime images drop root (OWASP Docker cheat sheet). */
describe("Dockerfile non-root USER", () => {
  it("app runner usa USER nextjs", () => {
    const raw = readFileSync(path.join(process.cwd(), "Dockerfile"), "utf8");
    expect(raw).toMatch(/USER\s+nextjs/);
  });

  it("worker usa USER worker", () => {
    const raw = readFileSync(
      path.join(process.cwd(), "Dockerfile.worker"),
      "utf8",
    );
    expect(raw).toMatch(/USER\s+worker/);
    expect(raw).toMatch(/adduser --system --uid 1001 worker/);
  });
});
