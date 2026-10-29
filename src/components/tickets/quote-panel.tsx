"use client";

import { useActionState } from "react";
import {
  decideQuoteAction,
  proposeQuoteAction,
  type QuoteActionState,
} from "@/app/actions/ticket-quote";
import { QuoteAmountFields } from "@/components/tickets/quote-amount-fields";
import { StatusPanel } from "@/components/ui/status-panel";
import { quoteStatusLabel } from "@/domain/ticket/quote-status-labels";
import type { Locale, MessageCatalog } from "@/i18n";

const initial: QuoteActionState = {};

type Props = {
  ticketId: string;
  mode: "propose" | "decide" | "readonly";
  quoteStatus: string | null;
  estimatedCost: number | null;
  labels: MessageCatalog["ticketPanels"];
  locale?: Locale;
  dateLocale?: string;
  currency?: string;
};

export function QuotePanel({
  ticketId,
  mode,
  quoteStatus,
  estimatedCost,
  labels,
  locale = "it",
  dateLocale = "it-IT",
  currency = "EUR",
}: Props) {
  const [proposeState, proposeAction, proposePending] = useActionState(
    proposeQuoteAction,
    initial,
  );
  const [decideState, decideAction, decidePending] = useActionState(
    decideQuoteAction,
    initial,
  );

  const statusLabel = quoteStatusLabel(quoteStatus, locale);

  return (
    <section className="mt-6 space-y-3 rounded-[var(--radius)] border border-[var(--border)] p-4">
      <h2 className="text-sm font-semibold">{labels.quoteTitle}</h2>
      <p className="text-sm text-[var(--muted-foreground)]">
        {labels.quoteStatusPrefix}{" "}
        <span className="font-medium text-[var(--foreground)]">
          {statusLabel}
        </span>
        {estimatedCost != null ? (
          <>
            {" "}
            ·{" "}
            {estimatedCost.toLocaleString(dateLocale, {
              style: "currency",
              currency,
            })}
          </>
        ) : null}
      </p>

      {mode === "propose" ? (
        <form action={proposeAction} className="space-y-3">
          <input type="hidden" name="ticketId" value={ticketId} />
          <QuoteAmountFields
            defaultAmount={estimatedCost}
            amountLabel={labels.amountLabel}
            noteLabel={labels.noteLabel}
          />
          {proposeState.error ? (
            <StatusPanel
              kind="error"
              title={proposeState.error}
              locale={locale}
            />
          ) : null}
          <button
            type="submit"
            disabled={proposePending}
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
          >
            {proposePending ? labels.pending : labels.quoteSubmit}
          </button>
        </form>
      ) : null}

      {mode === "decide" ? (
        <form action={decideAction} className="space-y-3">
          <input type="hidden" name="ticketId" value={ticketId} />
          <label className="block text-sm font-medium">
            {labels.quoteReason}
            <input
              name="reason"
              maxLength={500}
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-base"
            />
          </label>
          {decideState.error ? (
            <StatusPanel
              kind="error"
              title={decideState.error}
              locale={locale}
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              name="decision"
              value="accept"
              disabled={decidePending}
              className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
            >
              {labels.quoteAccept}
            </button>
            <button
              type="submit"
              name="decision"
              value="reject"
              disabled={decidePending}
              className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {labels.quoteReject}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
