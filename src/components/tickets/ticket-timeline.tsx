import type { MessageCatalog } from "@/i18n";

type EventRow = {
  id: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  createdAt: Date;
  meta: unknown;
  showInternalNotes?: boolean;
};

type TimelineLabels = MessageCatalog["ticketTimeline"];

function eventLabel(labels: TimelineLabels, type: string): string {
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
  };
  return map[type] ?? type;
}

export function TicketTimeline({
  events,
  showInternalNotes = false,
  labels,
  dateLocale = "it-IT",
}: {
  events: EventRow[];
  showInternalNotes?: boolean;
  labels: TimelineLabels;
  dateLocale?: string;
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">{labels.empty}</p>
    );
  }

  return (
    <ol className="mt-3 space-y-3 border-l border-[var(--border)] pl-4">
      {events.map((e) => {
        const meta = e.meta as {
          noteInternal?: string;
          reason?: string;
          note?: string;
          actualCost?: number;
          amountEur?: number;
          completionReport?: string;
        } | null;
        const label = eventLabel(labels, e.type);
        return (
          <li key={e.id} className="text-sm">
            <span className="font-medium">{label}</span>
            {e.fromStatus || e.toStatus ? (
              <span>
                {" "}
                ({e.fromStatus ?? "—"} → {e.toStatus ?? "—"})
              </span>
            ) : null}
            <span className="text-[var(--muted-foreground)]">
              {" "}
              · {e.createdAt.toLocaleString(dateLocale)}
            </span>
            {showInternalNotes && meta?.noteInternal ? (
              <p className="mt-0.5 text-[var(--muted-foreground)]">
                {labels.noteInternal} {meta.noteInternal}
              </p>
            ) : null}
            {meta?.reason || meta?.note ? (
              <p className="mt-0.5 text-[var(--muted-foreground)]">
                {meta.reason ?? meta.note}
              </p>
            ) : null}
            {meta?.actualCost != null ? (
              <p className="mt-0.5 text-[var(--muted-foreground)]">
                {labels.cost} {meta.actualCost} EUR
              </p>
            ) : null}
            {meta?.amountEur != null ? (
              <p className="mt-0.5 text-[var(--muted-foreground)]">
                {labels.quote} {meta.amountEur} EUR
              </p>
            ) : null}
            {meta?.completionReport ? (
              <p className="mt-0.5 text-[var(--muted-foreground)]">
                {labels.report} {meta.completionReport}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
