/** Tipi Notification (T3.1 / US-E08-03). */
export const NotificationType = {
  ticketCreated: "ticket.created",
  ticketAssigned: "ticket.assigned",
  ticketCancelled: "ticket.cancelled",
  ticketBreached: "ticket.breached",
  ticketDone: "ticket.done",
  ticketVerified: "ticket.verified",
  ticketRejected: "ticket.rejected",
} as const;

export type NotificationTypeId =
  (typeof NotificationType)[keyof typeof NotificationType];
