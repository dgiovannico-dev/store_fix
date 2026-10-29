import { describe, expect, it } from "vitest";
import { formatMoney } from "./format";

describe("formatMoney", () => {
  it("EUR it-IT", () => {
    const s = formatMoney(12.5, { dateLocale: "it-IT", currency: "EUR" });
    expect(s).toContain("12");
    expect(s).toMatch(/€|EUR/);
  });

  it("GBP en-GB", () => {
    const s = formatMoney(10, { dateLocale: "en-GB", currency: "GBP" });
    expect(s).toMatch(/£|GBP/);
  });
});
