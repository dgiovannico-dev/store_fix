import type { QuoteStatus } from "@prisma/client";
import { t, type Locale } from "@/i18n";

/** Etichetta UI IT/EN per `QuoteStatus` (preventivo ticket F2-02). */
export function quoteStatusLabel(
  status: QuoteStatus | string | null | undefined,
  locale: Locale = "it",
): string {
  const map = t(locale).quoteStatus;
  if (!status) return map.none;
  return (map as Record<string, string>)[status] ?? status;
}
