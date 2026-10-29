import { TicketStatus } from "@prisma/client";

/** Codici stabili → copy in `i18n.domainErrors` al boundary UI. */
export type TicketImmutableCode =
  | "ticketImmutableVerified"
  | "ticketImmutableCancelled";

export class TicketImmutableError extends Error {
  readonly code: TicketImmutableCode;

  constructor(code: TicketImmutableCode = "ticketImmutableVerified") {
    // Messaggio diagnostico EN (log/test); UI usa `code`
    super(
      code === "ticketImmutableCancelled"
        ? "Cancelled ticket: not editable"
        : "Verified ticket: key fields are immutable",
    );
    this.name = "TicketImmutableError";
    this.code = code;
  }
}

/** Dopo `verified` nessuna mutazione di stato/costi/vendor (note append-only ok). */
export function assertTicketMutable(status: TicketStatus): void {
  if (status === TicketStatus.verified) {
    throw new TicketImmutableError("ticketImmutableVerified");
  }
  if (status === TicketStatus.cancelled) {
    throw new TicketImmutableError("ticketImmutableCancelled");
  }
}
