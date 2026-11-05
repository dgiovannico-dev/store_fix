/**
 * Canonical public origin + deep links (email, push, QR, digest).
 * Single place for NEXT_PUBLIC_APP_URL trim + localhost fallback.
 */

export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/** Absolute HQ ticket URL (email, ntfy, digest). */
export function ticketDeepLink(ticketId: string): string {
  return `${appBaseUrl()}/app/tickets/${ticketId}`;
}

/** F9-01 digest “Segna rivisto” CTA. */
export function digestAckDeepLink(weekKey: string): string {
  return `${appBaseUrl()}/app/dashboard?digestAck=${encodeURIComponent(weekKey)}`;
}

/** F6-09 / F9-08 wallboard QR → ticket list. */
export function ticketsListDeepLink(): string {
  return `${appBaseUrl()}/app/tickets`;
}

/** Intake hub absolute link for a store. */
export function segnalaStoreDeepLink(storeId: string): string {
  return `${appBaseUrl()}/app/segnala/${storeId}`;
}

/** In-app relative path (notification bell / Link href). */
export function ticketPathForRole(
  role: string | null | undefined,
  ticketId: string,
): string {
  if (role === "vendor") return `/vendor/tickets/${ticketId}`;
  return `/app/tickets/${ticketId}`;
}
