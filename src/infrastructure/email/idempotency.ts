/**
 * Helper chiave idempotenza email (F3-09).
 * SoR = UNIQUE EmailOutbox.idempotencyKey — niente Set in-memory.
 */
export function emailIdempotencyKey(input: {
  template: string;
  ticketId?: string;
  recipient: string;
}): string {
  const ticket = input.ticketId ?? "-";
  const to = input.recipient.trim().toLowerCase();
  return `${input.template}:${ticket}:${to}`;
}
