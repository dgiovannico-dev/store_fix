import type { QuoteBidStatus, QuoteRequestStatus } from "@prisma/client";
import { t, type Locale } from "@/i18n";

/** Etichetta UI IT/EN per `QuoteRequestStatus` (liste / dettaglio RFQ). */
export function rfqRequestStatusLabel(
  status: QuoteRequestStatus | string,
  locale: Locale = "it",
): string {
  const map = t(locale).rfqRequestStatus as Record<string, string>;
  return map[status] ?? status;
}

/** Etichetta UI IT/EN per `QuoteBidStatus`. */
export function rfqBidStatusLabel(
  status: QuoteBidStatus | string,
  locale: Locale = "it",
): string {
  const map = t(locale).rfqBidStatus as Record<string, string>;
  return map[status] ?? status;
}
