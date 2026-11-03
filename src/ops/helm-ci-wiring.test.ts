import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Helm template CI wiring (F4)", () => {
  it("ci.yml esegue helm:template dopo setup-helm pin", () => {
    const ci = readFileSync(
      path.join(process.cwd(), ".github/workflows/ci.yml"),
      "utf8",
    );
    expect(ci).toMatch(/azure\/setup-helm@/);
    expect(ci).toMatch(/version:\s*"v3\.16\.4"/);
    expect(ci).toMatch(/npm run helm:template/);
  });
});
