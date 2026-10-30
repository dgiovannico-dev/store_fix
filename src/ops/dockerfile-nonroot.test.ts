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

  it("pinna node a patch tag 22.x.y-alpine (no floating 22-alpine)", () => {
    for (const file of ["Dockerfile", "Dockerfile.worker"]) {
      const raw = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(raw).toMatch(/FROM node:22\.\d+\.\d+-alpine/);
      expect(raw).not.toMatch(/FROM node:22-alpine/);
    }
  });

  it("CI e .nvmrc allineati al pin Dockerfile", () => {
    const nvm = readFileSync(path.join(process.cwd(), ".nvmrc"), "utf8").trim();
    const ci = readFileSync(
      path.join(process.cwd(), ".github/workflows/ci.yml"),
      "utf8",
    );
    const df = readFileSync(path.join(process.cwd(), "Dockerfile"), "utf8");
    const m = df.match(/FROM node:(22\.\d+\.\d+)-alpine/);
    expect(m?.[1]).toBeTruthy();
    expect(nvm).toBe(m![1]);
    expect(ci).toMatch(new RegExp(`node-version:\\s*"${m![1]}"`));
  });
});


