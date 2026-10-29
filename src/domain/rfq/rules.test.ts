import { QuoteBidStatus, QuoteRequestStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canAwardRfqBid, canSubmitRfqBid } from "./rules";

describe("rfq rules", () => {
  it("submit solo su RFQ open", () => {
    expect(
      canSubmitRfqBid({
        requestStatus: QuoteRequestStatus.open,
        bidStatus: QuoteBidStatus.invited,
      }),
    ).toBe(true);
    expect(
      canSubmitRfqBid({
        requestStatus: QuoteRequestStatus.awarded,
        bidStatus: QuoteBidStatus.invited,
      }),
    ).toBe(false);
  });

  it("award solo bid submitted con importo", () => {
    expect(
      canAwardRfqBid({
        requestStatus: QuoteRequestStatus.open,
        bidStatus: QuoteBidStatus.submitted,
        amountEur: 100,
      }),
    ).toBe(true);
    expect(
      canAwardRfqBid({
        requestStatus: QuoteRequestStatus.open,
        bidStatus: QuoteBidStatus.invited,
        amountEur: null,
      }),
    ).toBe(false);
  });
});
