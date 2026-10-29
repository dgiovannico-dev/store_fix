import { Role, TicketStatus } from "@prisma/client";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { formatMoney } from "@/i18n/format";

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

/** @deprecated prefer formatMoney(prefs) — resta EUR/it-IT per compat. */
export function formatEur(
  value: { toString(): string } | number | null | undefined,
): string | null {
  return formatMoney(value, { dateLocale: "it-IT", currency: "EUR" });
}
