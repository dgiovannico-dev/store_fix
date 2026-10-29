import {
  QuoteBidStatus,
  QuoteRequestStatus,
} from "@prisma/client";

export function canSubmitRfqBid(input: {
  requestStatus: QuoteRequestStatus;
  bidStatus: QuoteBidStatus;
}): boolean {
  return (
    input.requestStatus === QuoteRequestStatus.open &&
    input.bidStatus !== QuoteBidStatus.withdrawn
  );
}

export function canAwardRfqBid(input: {
  requestStatus: QuoteRequestStatus;
  bidStatus: QuoteBidStatus;
  amountEur: unknown;
}): boolean {
  if (input.requestStatus !== QuoteRequestStatus.open) return false;
  if (input.bidStatus !== QuoteBidStatus.submitted) return false;
  return input.amountEur != null;
}
