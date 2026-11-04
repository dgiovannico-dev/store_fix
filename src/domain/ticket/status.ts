import { TicketStatus } from "@prisma/client";

/** Stati ticket MVP — allineati a Prisma `TicketStatus` / US-E04-03. */
export const TICKET_STATUSES = [
  TicketStatus.open,
  TicketStatus.triaged,
  TicketStatus.assigned,
  TicketStatus.in_progress,
  TicketStatus.waiting_parts,
  TicketStatus.done,
  TicketStatus.verified,
  TicketStatus.cancelled,
] as const;

export type TicketStatusId = (typeof TICKET_STATUSES)[number];

/** Aperti / in corso (SLA, digest, wallboard) — single source (R2.4). */
export const OPEN_TICKET_STATUSES: TicketStatus[] = [
  TicketStatus.open,
  TicketStatus.triaged,
  TicketStatus.assigned,
  TicketStatus.in_progress,
  TicketStatus.waiting_parts,
];

export const TERMINAL_STATUSES: ReadonlySet<TicketStatus> = new Set([
  TicketStatus.verified,
  TicketStatus.cancelled,
]);

export function isTerminal(status: TicketStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}
