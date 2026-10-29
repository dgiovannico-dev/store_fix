"use client";

import { useActionState } from "react";
import {
  relaunchSlaAction,
  type RelaunchState,
} from "@/app/actions/sla-ops";
import { StatusPanel } from "@/components/ui/status-panel";
import type { Locale, MessageCatalog } from "@/i18n";

type Props = {
  ticketId: string;
  breached: boolean;
  canOps: boolean;
  labels: MessageCatalog["ticketPanels"];
  locale?: Locale;
};

const initial: RelaunchState = {};

export function SlaRelaunchPanel({
  ticketId,
  breached,
  canOps,
  labels,
  locale = "it",
}: Props) {
  const [state, action, pending] = useActionState(relaunchSlaAction, initial);
  if (!canOps || !breached) return null;

  return (
    <section className="mt-8 space-y-3 border-t border-[var(--border)] pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {labels.slaTitle}
      </h2>
      <form action={action} className="space-y-3">
        <input type="hidden" name="ticketId" value={ticketId} />
        <label className="block text-sm font-medium">
          {labels.slaNote}
          <textarea
            name="note"
            required
            minLength={3}
            rows={2}
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
        </label>
        {state.error ? (
          <StatusPanel kind="error" title={state.error} locale={locale} />
        ) : null}
        {state.ok ? (
          <p className="text-sm text-[var(--success)]" role="status">
            {labels.slaOk}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {pending ? labels.pending : labels.slaSubmit}
        </button>
      </form>
    </section>
  );
}
