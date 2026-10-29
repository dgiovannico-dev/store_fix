import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("robots.txt route", () => {
  it("disallow all + X-Robots-Tag", () => {
    const raw = readFileSync(
      path.join(process.cwd(), "src/app/robots.txt/route.ts"),
      "utf8",
    );
    expect(raw).toMatch(/Disallow:\s*\//);
    expect(raw).toMatch(/User-agent:\s*\*/);
    expect(raw).toMatch(/noindex,\s*nofollow/);
  });
});
