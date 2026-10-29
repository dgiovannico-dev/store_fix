/**
 * Idempotenza anti-spam email (T2.25).
 * Chiave tipica: `${template}:${ticketId}:${recipient}`
 * In-process (MVP single-node); con pg-boss si usa anche singletonKey.
 */
const seen = new Set<string>();

export function emailIdempotencyKey(input: {
  template: string;
  ticketId?: string;
  recipient: string;
}): string {
  const ticket = input.ticketId ?? "-";
  const to = input.recipient.trim().toLowerCase();
  return `${input.template}:${ticket}:${to}`;
}

/** @returns true se la chiave è nuova (ok inviare); false se già usata. */
export function claimEmailIdempotency(key: string): boolean {
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}

export function _resetEmailIdempotencyForTests(): void {
  seen.clear();
}
