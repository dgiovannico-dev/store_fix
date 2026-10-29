import { QuoteStatus, TicketStatus } from "@prisma/client";

const QUOTEABLE: ReadonlySet<TicketStatus> = new Set([
  TicketStatus.assigned,
  TicketStatus.in_progress,
  TicketStatus.waiting_parts,
]);

export function canProposeQuote(status: TicketStatus): boolean {
  return QUOTEABLE.has(status);
}

export function canDecideQuote(
  status: TicketStatus,
  quoteStatus: QuoteStatus | null,
): boolean {
  return quoteStatus === QuoteStatus.pending && QUOTEABLE.has(status);
}

/** Vendor non può chiudere se preventivo ancora in attesa. */
export function blocksCompleteWork(
  quoteStatus: QuoteStatus | null,
): boolean {
  return quoteStatus === QuoteStatus.pending;
}

export function parseQuoteAmount(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

export const QUOTE_STATUS_LABEL_IT: Record<QuoteStatus, string> = {
  pending: "In attesa",
  accepted: "Accettato",
  rejected: "Rifiutato",
};
