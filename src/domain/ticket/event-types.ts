/** Tipi TicketEvent (T3.2 / US-E10-01). */
export const TicketEventType = {
  statusChanged: "status_changed",
  assigned: "assigned",
  noteAdded: "note_added",
  attachmentAdded: "attachment_added",
  costSet: "cost_set",
  slaBreached: "sla_breached",
  slaRelaunch: "sla_relaunch",
  verified: "verified",
  rejected: "rejected",
  quoteProposed: "quote_proposed",
  quoteAccepted: "quote_accepted",
  quoteRejected: "quote_rejected",
  /** Soft-delete post retention GDPR (US-E12-01 / gdpr.purge) */
  gdprRetentionPurge: "gdpr_retention_purge",
  /** Legacy S2 — ancora presenti in timeline */
  ticketCreated: "ticket.created",
  ticketTriaged: "ticket.triaged",
  ticketAssigned: "ticket.assigned",
  ticketCancelled: "ticket.cancelled",
} as const;

export type TicketEventTypeId =
  (typeof TicketEventType)[keyof typeof TicketEventType];
