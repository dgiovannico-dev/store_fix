import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** Gate: Compose build must not ship host node_modules/.next into context. */
describe(".dockerignore", () => {
  const raw = readFileSync(path.join(process.cwd(), ".dockerignore"), "utf8");

  it("esclude node_modules e .next", () => {
    expect(raw).toMatch(/^node_modules\/?$/m);
    expect(raw).toMatch(/^\.next\/?$/m);
    expect(raw).toMatch(/^\.git\/?$/m);
    expect(raw).toMatch(/^\.env$/m);
  });
});
