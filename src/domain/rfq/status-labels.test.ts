import { QuoteBidStatus, QuoteRequestStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { rfqBidStatusLabel, rfqRequestStatusLabel } from "./status-labels";

describe("rfq status labels", () => {
  it("mappa request/bid IT/EN e fallback raw", () => {
    expect(rfqRequestStatusLabel(QuoteRequestStatus.open)).toMatch(/Aperta/i);
    expect(rfqRequestStatusLabel(QuoteRequestStatus.awarded, "en")).toMatch(
      /Awarded/i,
    );
    expect(rfqBidStatusLabel(QuoteBidStatus.invited, "it")).toMatch(/Invitato/i);
    expect(rfqBidStatusLabel(QuoteBidStatus.submitted, "en")).toMatch(
      /Submitted/i,
    );
    expect(rfqRequestStatusLabel("legacy_xyz")).toBe("legacy_xyz");
    expect(rfqBidStatusLabel("legacy_xyz")).toBe("legacy_xyz");
  });
});
