import type { MessageCatalog } from "@/i18n";
import { ticketEventLabel } from "@/domain/ticket/event-labels";

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
        const label = ticketEventLabel(labels, e.type);
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
