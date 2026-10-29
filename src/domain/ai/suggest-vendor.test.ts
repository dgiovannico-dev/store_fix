import { describe, expect, it } from "vitest";
import { suggestVendorHeuristic } from "./suggest-vendor";

describe("suggestVendorHeuristic", () => {
  const vendors = [
    {
      id: "v1",
      name: "Alpha Frigo",
      trades: ["frigo"],
      storeCoverageIds: ["s1"],
    },
    {
      id: "v2",
      name: "Beta HVAC",
      trades: ["hvac"],
      storeCoverageIds: ["s2"],
    },
    {
      id: "v3",
      name: "Gamma rete",
      trades: ["porte"],
      storeCoverageIds: [],
    },
  ];

  it("preferisce coverage+trade", () => {
    const s = suggestVendorHeuristic({
      storeId: "s1",
      category: "frigo",
      vendors,
    });
    expect(s?.vendorId).toBe("v1");
    expect(s?.source).toBe("coverage_trade");
  });

  it("cade su trade se coverage altro store", () => {
    const s = suggestVendorHeuristic({
      storeId: "s9",
      category: "hvac",
      vendors,
    });
    expect(s?.vendorId).toBe("v2");
    expect(s?.source).toBe("trade");
  });

  it("coverage vuota = tutta la rete", () => {
    const s = suggestVendorHeuristic({
      storeId: "s1",
      category: "porte",
      vendors,
    });
    expect(s?.vendorId).toBe("v3");
  });
});
