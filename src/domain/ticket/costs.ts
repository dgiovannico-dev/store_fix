import { Role, TicketStatus } from "@prisma/client";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";

const COST_VISIBLE: ReadonlySet<TicketStatus> = new Set([
  TicketStatus.done,
  TicketStatus.verified,
  TicketStatus.in_progress,
  TicketStatus.waiting_parts,
  TicketStatus.assigned,
]);

/** Read costi: RBAC viewCosts + ticket nello scope chiamante (enforced altrove). */
export function canReadTicketCosts(
  role: Role,
  status: TicketStatus,
): boolean {
  if (!can(role, RbacAction.viewCosts)) return false;
  if (role === Role.viewer_finance) {
    return (
      status === TicketStatus.done || status === TicketStatus.verified
    );
  }
  if (role === Role.store_manager) {
    // F2-02: store vede stima/preventivo anche pre-chiusura (path assegnato)
    return COST_VISIBLE.has(status);
  }
  // HQ + vendor (scoped): vedi su ticket assegnati / aperti path
  return COST_VISIBLE.has(status);
}

export function formatEur(
  value: { toString(): string } | number | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value.toString());
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}
