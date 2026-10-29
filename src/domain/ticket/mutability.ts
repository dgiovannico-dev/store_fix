import { TicketStatus } from "@prisma/client";

export class TicketImmutableError extends Error {
  constructor(message = "Ticket verificato: campi chiave immutabili") {
    super(message);
    this.name = "TicketImmutableError";
  }
}

/** Dopo `verified` nessuna mutazione di stato/costi/vendor (note append-only ok). */
export function assertTicketMutable(status: TicketStatus): void {
  if (status === TicketStatus.verified) {
    throw new TicketImmutableError();
  }
  if (status === TicketStatus.cancelled) {
    throw new TicketImmutableError("Ticket annullato: non modificabile");
  }
}
