import { StatusPanel } from "@/components/ui/status-panel";
import { ticketEventLabel } from "@/domain/ticket/event-labels";
import { ticketStatusLabel } from "@/domain/ticket/status-labels";
import {
  formatDateTime,
  formatMoney,
  type FormatPrefs,
  type Locale,
  type MessageCatalog,
} from "@/i18n";

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
  locale = "it",
  currency = "EUR",
}: {
  events: EventRow[];
  showInternalNotes?: boolean;
  labels: TimelineLabels;
  dateLocale?: string;
  locale?: Locale;
  currency?: string;
}) {
  const moneyPrefs: FormatPrefs = { dateLocale, currency };

  if (events.length === 0) {
    return (
      <StatusPanel kind="empty" title={labels.empty} locale={locale} />
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
        const fromLabel = e.fromStatus
          ? ticketStatusLabel(e.fromStatus, locale)
          : null;
        const toLabel = e.toStatus
          ? ticketStatusLabel(e.toStatus, locale)
          : null;
        const costFmt =
          meta?.actualCost != null
            ? formatMoney(meta.actualCost, moneyPrefs)
            : null;
        const quoteFmt =
          meta?.amountEur != null
            ? formatMoney(meta.amountEur, moneyPrefs)
            : null;
        return (
          <li key={e.id} className="text-sm">
            <span className="font-medium">{label}</span>
            {fromLabel || toLabel ? (
              <span>
                {" "}
                ({fromLabel ?? "—"} → {toLabel ?? "—"})
              </span>
            ) : null}
            <span className="text-[var(--muted-foreground)]">
              {" "}
              · {formatDateTime(e.createdAt, moneyPrefs)}
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
            {costFmt ? (
              <p className="mt-0.5 text-[var(--muted-foreground)]">
                {labels.cost} {costFmt}
              </p>
            ) : null}
            {quoteFmt ? (
              <p className="mt-0.5 text-[var(--muted-foreground)]">
                {labels.quote} {quoteFmt}
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
