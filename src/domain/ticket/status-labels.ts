import { TicketStatus } from "@prisma/client";
import { t, type Locale } from "@/i18n";

/** Etichetta UI IT/EN per `TicketStatus` (liste, filtri, dettaglio). */
export function ticketStatusLabel(
  status: TicketStatus | string,
  locale: Locale = "it",
): string {
  const map = t(locale).ticketStatus as Record<string, string>;
  return map[status] ?? status;
}
