"use client";

import { useActionState, useState } from "react";
import {
  assignTicketAction,
  cancelTicketAction,
  triageTicketAction,
  type TicketActionState,
} from "@/app/actions/tickets";
import { StatusPanel } from "@/components/ui/status-panel";
import { intakePriorityOptions } from "@/domain/intake/chat-steps";
import type { Locale, MessageCatalog } from "@/i18n";

type VendorOpt = { id: string; name: string };
type Hint = { vendorId: string; vendorName: string } | null;

type Props = {
  ticketId: string;
  status: string;
  priority: string;
  storeId: string;
  category: string;
  vendors: VendorOpt[];
  preferredHint: Hint;
  canOps: boolean;
  labels: MessageCatalog["ticketPanels"];
  locale?: Locale;
};

const initial: TicketActionState = {};

export function TicketOpsPanel({
  ticketId,
  status,
  priority,
  storeId,
  category,
  vendors,
  preferredHint,
  canOps,
  labels,
  locale = "it",
}: Props) {
  const priorities = intakePriorityOptions(locale);
  const [triageState, triageAction, triagePending] = useActionState(
    triageTicketAction,
    initial,
  );
  const [assignState, assignAction, assignPending] = useActionState(
    assignTicketAction,
    initial,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelTicketAction,
    initial,
  );
  const [vendorId, setVendorId] = useState(preferredHint?.vendorId ?? "");
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [aiPending, setAiPending] = useState(false);

  if (!canOps) return null;

  return (
    <section className="mt-8 space-y-6 border-t border-[var(--border)] pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {labels.opsTitle}
      </h2>

      {preferredHint ? (
        <p className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm">
          {labels.opsPreferred}{" "}
          <strong>{preferredHint.vendorName}</strong> {labels.opsPreferredManual}
        </p>
      ) : null}

      {status === "open" ? (
        <form action={triageAction} className="space-y-3">
          <input type="hidden" name="ticketId" value={ticketId} />
          <label className="block text-sm font-medium">
            {labels.opsInternalNote}
            <textarea
              name="note"
              rows={2}
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm"
            />
          </label>
          {triageState.error ? (
            <StatusPanel
              kind="error"
              title={triageState.error}
              locale={locale}
            />
          ) : null}
          <button
            type="submit"
            disabled={triagePending}
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
          >
            {triagePending ? labels.pending : labels.opsTriage}
          </button>
        </form>
      ) : null}

      {status === "triaged" ? (
        <form action={assignAction} className="space-y-3">
          <input type="hidden" name="ticketId" value={ticketId} />
          <label className="block text-sm font-medium">
            {labels.opsVendor}
            <select
              name="vendorId"
              required
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm"
            >
              <option value="" disabled>
                {labels.opsSelect}
              </option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                  {preferredHint?.vendorId === v.id
                    ? labels.opsPreferredMark
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={aiPending || !storeId || !category}
            onClick={async () => {
              setAiPending(true);
              setAiHint(null);
              try {
                const res = await fetch("/api/ai/suggest-vendor", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ storeId, category }),
                });
                if (!res.ok) return;
                const data = (await res.json()) as {
                  suggestion: {
                    vendorId: string;
                    vendorName: string;
                    rationale: string;
                  } | null;
                };
                if (!data.suggestion) {
                  setAiHint(labels.opsAiNone);
                  return;
                }
                setAiHint(
                  `${data.suggestion.vendorName} — ${data.suggestion.rationale}`,
                );
                setVendorId(data.suggestion.vendorId);
              } finally {
                setAiPending(false);
              }
            }}
            className="text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline disabled:opacity-60"
          >
            {aiPending ? labels.opsAiPending : labels.opsAiSuggest}
          </button>
          {aiHint ? (
            <p className="text-xs text-[var(--muted-foreground)]">{aiHint}</p>
          ) : null}
          <label className="block text-sm font-medium">
            {labels.opsPriority}
            <select
              name="priority"
              defaultValue={priority}
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm"
            >
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            {labels.opsInternalNote}
            <textarea
              name="note"
              rows={2}
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm"
            />
          </label>
          {assignState.error ? (
            <StatusPanel
              kind="error"
              title={assignState.error}
              locale={locale}
            />
          ) : null}
          <button
            type="submit"
            disabled={assignPending || vendors.length === 0}
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
          >
            {assignPending ? labels.pending : labels.opsAssign}
          </button>
        </form>
      ) : null}

      {status !== "cancelled" && status !== "verified" ? (
        <form action={cancelAction} className="space-y-3">
          <input type="hidden" name="ticketId" value={ticketId} />
          <label className="block text-sm font-medium">
            {labels.opsCancelLabel}
            <textarea
              name="reason"
              required
              minLength={3}
              rows={2}
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm"
            />
          </label>
          {cancelState.error ? (
            <StatusPanel
              kind="error"
              title={cancelState.error}
              locale={locale}
            />
          ) : null}
          <button
            type="submit"
            disabled={cancelPending}
            className="rounded-[var(--radius)] border border-[var(--critical)] px-4 py-2 text-sm font-medium text-[var(--critical)] disabled:opacity-60"
          >
            {cancelPending ? labels.pending : labels.opsCancel}
          </button>
        </form>
      ) : null}
    </section>
  );
}
