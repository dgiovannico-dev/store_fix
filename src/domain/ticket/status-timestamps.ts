import { TicketStatus } from "@prisma/client";

/** Campi timestamp ingresso stato su Ticket (T2.3). */
export function statusTimestampData(
  to: TicketStatus,
  at = new Date(),
): Partial<
  Record<
    | "openedAt"
    | "triagedAt"
    | "assignedAt"
    | "inProgressAt"
    | "waitingPartsAt"
    | "doneAt"
    | "verifiedAt"
    | "cancelledAt",
    Date
  >
> {
  switch (to) {
    case TicketStatus.open:
      return { openedAt: at };
    case TicketStatus.triaged:
      return { triagedAt: at };
    case TicketStatus.assigned:
      return { assignedAt: at };
    case TicketStatus.in_progress:
      return { inProgressAt: at };
    case TicketStatus.waiting_parts:
      return { waitingPartsAt: at };
    case TicketStatus.done:
      return { doneAt: at };
    case TicketStatus.verified:
      return { verifiedAt: at };
    case TicketStatus.cancelled:
      return { cancelledAt: at };
    default:
      return {};
  }
}
