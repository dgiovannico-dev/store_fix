"use client";

import { useActionState } from "react";
import {
  rejectTicketAction,
  verifyTicketAction,
  type VerifyActionState,
} from "@/app/actions/verify-tickets";
import { StatusPanel } from "@/components/ui/status-panel";
import type { Locale, MessageCatalog } from "@/i18n";

type Props = {
  ticketId: string;
  status: string;
  canVerify: boolean;
  labels: MessageCatalog["ticketPanels"];
  locale?: Locale;
};

const initial: VerifyActionState = {};

export function VerifyPanel({
  ticketId,
  status,
  canVerify,
  labels,
  locale = "it",
}: Props) {
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyTicketAction,
    initial,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectTicketAction,
    initial,
  );

  if (!canVerify || status !== "done") return null;

  return (
    <section className="mt-8 space-y-4 border-t border-[var(--border)] pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {labels.verifyTitle}
      </h2>
      <form action={verifyAction}>
        <input type="hidden" name="ticketId" value={ticketId} />
        <button
          type="submit"
          disabled={verifyPending}
          className="w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-3 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
        >
          {verifyPending ? labels.pending : labels.verifyConfirm}
        </button>
      </form>
      {verifyState.error ? (
        <StatusPanel
          kind="error"
          title={verifyState.error}
          locale={locale}
        />
      ) : null}

      <form action={rejectAction} className="space-y-2">
        <input type="hidden" name="ticketId" value={ticketId} />
        <label className="block text-sm font-medium">
          {labels.verifyRejectLabel}
          <textarea
            name="reason"
            required
            minLength={5}
            rows={2}
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
        </label>
        {rejectState.error ? (
          <StatusPanel
            kind="error"
            title={rejectState.error}
            locale={locale}
          />
        ) : null}
        <button
          type="submit"
          disabled={rejectPending}
          className="w-full rounded-[var(--radius)] border border-[var(--critical)] px-4 py-3 text-sm font-medium text-[var(--critical)] disabled:opacity-60"
        >
          {rejectPending ? labels.pending : labels.verifyReject}
        </button>
      </form>
    </section>
  );
}
