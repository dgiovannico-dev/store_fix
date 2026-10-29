type EventRow = {
  id: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  createdAt: Date;
  meta: unknown;
  showInternalNotes?: boolean;
};

const TYPE_IT: Record<string, string> = {
  "ticket.created": "Apertura",
  "ticket.triaged": "Triage",
  "ticket.assigned": "Assegnazione",
  "ticket.cancelled": "Annullamento",
  status_changed: "Cambio stato",
  assigned: "Assegnazione",
  cost_set: "Costo impostato",
  sla_breached: "SLA superato",
  sla_relaunch: "Rilancio SLA",
  verified: "Verificato",
  rejected: "Verifica rifiutata",
  note_added: "Nota",
  attachment_added: "Allegato",
  quote_proposed: "Preventivo proposto",
  quote_accepted: "Preventivo accettato",
  quote_rejected: "Preventivo rifiutato",
};

export function TicketTimeline({
  events,
  showInternalNotes = false,
}: {
  events: EventRow[];
  showInternalNotes?: boolean;
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Nessun evento in timeline.
      </p>
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
        const label = TYPE_IT[e.type] ?? e.type;
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
              · {e.createdAt.toLocaleString("it-IT")}
            </span>
            {showInternalNotes && meta?.noteInternal ? (
              <p className="mt-0.5 text-[var(--muted-foreground)]">
                Nota interna: {meta.noteInternal}
              </p>
            ) : null}
            {meta?.reason || meta?.note ? (
              <p className="mt-0.5 text-[var(--muted-foreground)]">
                {meta.reason ?? meta.note}
              </p>
            ) : null}
            {meta?.actualCost != null ? (
              <p className="mt-0.5 text-[var(--muted-foreground)]">
                Costo: {meta.actualCost} EUR
              </p>
            ) : null}
            {meta?.amountEur != null ? (
              <p className="mt-0.5 text-[var(--muted-foreground)]">
                Preventivo: {meta.amountEur} EUR
              </p>
            ) : null}
            {meta?.completionReport ? (
              <p className="mt-0.5 text-[var(--muted-foreground)]">
                Report: {meta.completionReport}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
