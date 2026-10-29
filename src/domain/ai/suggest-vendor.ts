export type VendorHint = {
  id: string;
  name: string;
  trades: string[];
  storeCoverageIds: string[];
};

export type VendorSuggestion = {
  vendorId: string;
  vendorName: string;
  source: "coverage_trade" | "trade" | "coverage" | "none";
  rationale: string;
};

/**
 * Suggerimento vendor deterministico (F2-07) — mai SoR.
 * Preferisce: coverage store + trade match → trade → coverage.
 */
export function suggestVendorHeuristic(input: {
  storeId: string;
  category: string;
  vendors: VendorHint[];
}): VendorSuggestion | null {
  const cat = input.category.trim().toLowerCase();
  const active = input.vendors.filter((v) => v.id && v.name);

  const coverage = active.filter(
    (v) =>
      v.storeCoverageIds.length === 0 ||
      v.storeCoverageIds.includes(input.storeId),
  );
  const tradeMatch = (v: VendorHint) =>
    cat.length > 0 &&
    v.trades.some((t) => t.toLowerCase().includes(cat) || cat.includes(t.toLowerCase()));

  const both = coverage.filter(tradeMatch);
  if (both[0]) {
    return {
      vendorId: both[0].id,
      vendorName: both[0].name,
      source: "coverage_trade",
      rationale: `Coverage su store + mestiere «${cat}»`,
    };
  }
  const byTrade = active.filter(tradeMatch);
  if (byTrade[0]) {
    return {
      vendorId: byTrade[0].id,
      vendorName: byTrade[0].name,
      source: "trade",
      rationale: `Mestiere allineato a «${cat}»`,
    };
  }
  if (coverage[0]) {
    return {
      vendorId: coverage[0].id,
      vendorName: coverage[0].name,
      source: "coverage",
      rationale: "Copertura punto vendita (mestiere non match)",
    };
  }
  return null;
}
