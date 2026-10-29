import type { MessageCatalog } from "@/i18n";

type TimelineLabels = MessageCatalog["ticketTimeline"];

/** Label IT/EN per tipo TicketEvent (timeline UI). */
export function ticketEventLabel(labels: TimelineLabels, type: string): string {
  const map: Record<string, string> = {
    "ticket.created": labels.evtCreated,
    "ticket.triaged": labels.evtTriaged,
    "ticket.assigned": labels.evtAssigned,
    "ticket.cancelled": labels.evtCancelled,
    status_changed: labels.evtStatusChanged,
    assigned: labels.evtAssignedLegacy,
    cost_set: labels.evtCostSet,
    sla_breached: labels.evtSlaBreached,
    sla_relaunch: labels.evtSlaRelaunch,
    verified: labels.evtVerified,
    rejected: labels.evtRejected,
    note_added: labels.evtNote,
    attachment_added: labels.evtAttachment,
    quote_proposed: labels.evtQuoteProposed,
    quote_accepted: labels.evtQuoteAccepted,
    quote_rejected: labels.evtQuoteRejected,
    gdpr_retention_purge: labels.evtGdprPurge,
  };
  return map[type] ?? type;
}
