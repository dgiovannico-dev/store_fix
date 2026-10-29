import { QuoteStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { quoteStatusLabel } from "./quote-status-labels";

describe("quoteStatusLabel", () => {
  it("mappa stati e null", () => {
    expect(quoteStatusLabel(null)).toMatch(/Nessuno/i);
    expect(quoteStatusLabel(QuoteStatus.pending, "en")).toMatch(/Pending/i);
    expect(quoteStatusLabel(QuoteStatus.accepted, "it")).toMatch(/Accettato/i);
    expect(quoteStatusLabel("legacy_xyz")).toBe("legacy_xyz");
  });
});
