import { describe, expect, it } from "vitest";
import { slugifyTenantName } from "./slug";

describe("slugifyTenantName", () => {
  it("normalizza accenti e spazi", () => {
    expect(slugifyTenantName("Retail Nord Italia")).toBe("retail-nord-italia");
    expect(slugifyTenantName("Caffè & Co.")).toBe("caffe-co");
  });
});
