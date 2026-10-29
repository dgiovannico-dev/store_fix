"use client";

import { useActionState } from "react";
import {
  vendorCompleteAction,
  vendorStatusAction,
  type VendorActionState,
} from "@/app/actions/vendor-tickets";
import type { MessageCatalog } from "@/i18n";

type Props = {
  ticketId: string;
  status: string;
  labels: MessageCatalog["ticketPanels"];
};

const initial: VendorActionState = {};

export function VendorTicketActions({ ticketId, status, labels }: Props) {
  const [statusState, statusAction, statusPending] = useActionState(
    vendorStatusAction,
    initial,
  );
  const [completeState, completeAction, completePending] = useActionState(
    vendorCompleteAction,
    initial,
  );

  return (
    <section className="mt-8 space-y-6 border-t border-[var(--border)] pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {labels.vendorTitle}
      </h2>

      {(status === "assigned" || status === "waiting_parts") && (
        <form action={statusAction}>
          <input type="hidden" name="ticketId" value={ticketId} />
          <input type="hidden" name="to" value="in_progress" />
          <button
            type="submit"
            disabled={statusPending}
            className="w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-3.5 text-base font-medium text-[var(--primary-foreground)] disabled:opacity-60"
          >
            {statusPending ? labels.pending : labels.vendorStart}
          </button>
        </form>
      )}

      {status === "in_progress" && (
        <form action={statusAction}>
          <input type="hidden" name="ticketId" value={ticketId} />
          <input type="hidden" name="to" value="waiting_parts" />
          <button
            type="submit"
            disabled={statusPending}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-3.5 text-base font-medium disabled:opacity-60"
          >
            {statusPending ? labels.pending : labels.vendorWaiting}
          </button>
        </form>
      )}

      {statusState.error ? (
        <p className="text-sm text-[var(--critical)]" role="alert">
          {statusState.error}
        </p>
      ) : null}

      {(status === "assigned" ||
        status === "in_progress" ||
        status === "waiting_parts") && (
        <form action={completeAction} className="space-y-3">
          <input type="hidden" name="ticketId" value={ticketId} />
          <p className="text-sm text-[var(--muted-foreground)]">
            {labels.vendorPhotoHint}
          </p>
          <label className="block text-sm font-medium">
            {labels.vendorActualCost}
            <input
              name="actualCost"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-3 text-base"
            />
          </label>
          <label className="block text-sm font-medium">
            {labels.vendorEstCost}
            <input
              name="estimatedCost"
              type="number"
              step="0.01"
              min="0"
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-3 text-base"
            />
          </label>
          <label className="block text-sm font-medium">
            {labels.vendorReport}
            <textarea
              name="completionReport"
              required
              minLength={5}
              rows={3}
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-3 text-base"
            />
          </label>
          {completeState.error ? (
            <p className="text-sm text-[var(--critical)]" role="alert">
              {completeState.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={completePending}
            className="w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-3.5 text-base font-medium text-[var(--primary-foreground)] disabled:opacity-60"
          >
            {completePending ? labels.pending : labels.vendorComplete}
          </button>
        </form>
      )}
    </section>
  );
}
