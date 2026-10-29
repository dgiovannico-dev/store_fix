import { describe, expect, it } from "vitest";
import { withCurrency } from "./format";

describe("withCurrency", () => {
  it("sostituisce {currency} e normalizza uppercase", () => {
    expect(withCurrency("Importo {currency} *", "eur")).toBe("Importo EUR *");
    expect(withCurrency("Amount {currency} *", "USD")).toBe("Amount USD *");
    expect(withCurrency("Fee {currency}", "")).toBe("Fee EUR");
  });
});
