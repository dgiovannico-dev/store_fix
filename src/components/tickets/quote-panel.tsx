"use client";

import { useActionState } from "react";
import {
  decideQuoteAction,
  proposeQuoteAction,
  type QuoteActionState,
} from "@/app/actions/ticket-quote";
import { QuoteAmountFields } from "@/components/tickets/quote-amount-fields";

const initial: QuoteActionState = {};

type Props = {
  ticketId: string;
  mode: "propose" | "decide" | "readonly";
  quoteStatus: string | null;
  estimatedCost: number | null;
};

const STATUS_IT: Record<string, string> = {
  pending: "In attesa",
  accepted: "Accettato",
  rejected: "Rifiutato",
};

export function QuotePanel({
  ticketId,
  mode,
  quoteStatus,
  estimatedCost,
}: Props) {
  const [proposeState, proposeAction, proposePending] = useActionState(
    proposeQuoteAction,
    initial,
  );
  const [decideState, decideAction, decidePending] = useActionState(
    decideQuoteAction,
    initial,
  );

  return (
    <section className="mt-6 space-y-3 rounded-[var(--radius)] border border-[var(--border)] p-4">
      <h2 className="text-sm font-semibold">Preventivo</h2>
      <p className="text-sm text-[var(--muted-foreground)]">
        Stato:{" "}
        <span className="font-medium text-[var(--foreground)]">
          {quoteStatus ? STATUS_IT[quoteStatus] ?? quoteStatus : "Nessuno"}
        </span>
        {estimatedCost != null ? (
          <>
            {" "}
            ·{" "}
            {estimatedCost.toLocaleString("it-IT", {
              style: "currency",
              currency: "EUR",
            })}
          </>
        ) : null}
      </p>

      {mode === "propose" ? (
        <form action={proposeAction} className="space-y-3">
          <input type="hidden" name="ticketId" value={ticketId} />
          <QuoteAmountFields defaultAmount={estimatedCost} />
          {proposeState.error ? (
            <p className="text-sm text-[var(--critical)]" role="alert">
              {proposeState.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={proposePending}
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
          >
            {proposePending ? "…" : "Invia preventivo"}
          </button>
        </form>
      ) : null}

      {mode === "decide" ? (
        <form action={decideAction} className="space-y-3">
          <input type="hidden" name="ticketId" value={ticketId} />
          <label className="block text-sm font-medium">
            Motivo (opz. su rifiuto)
            <input
              name="reason"
              maxLength={500}
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-base"
            />
          </label>
          {decideState.error ? (
            <p className="text-sm text-[var(--critical)]" role="alert">
              {decideState.error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              name="decision"
              value="accept"
              disabled={decidePending}
              className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
            >
              Accetta
            </button>
            <button
              type="submit"
              name="decision"
              value="reject"
              disabled={decidePending}
              className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              Rifiuta
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
