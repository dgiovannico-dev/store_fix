"use client";

import { useActionState } from "react";
import {
  inviteFromTicketAction,
  type InviteFromTicketState,
} from "@/app/actions/invite-from-ticket";
import { StatusPanel } from "@/components/ui/status-panel";
import type { Locale, MessageCatalog } from "@/i18n";

type Props = {
  canInvite: boolean;
  storeId: string;
  vendorId: string | null;
  labels: MessageCatalog["ticketPanels"];
  locale?: Locale;
};

const initial: InviteFromTicketState = {};

export function TicketInvitePanel({
  canInvite,
  storeId,
  vendorId,
  labels,
  locale = "it",
}: Props) {
  const [state, action, pending] = useActionState(
    inviteFromTicketAction,
    initial,
  );
  if (!canInvite) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">{labels.inviteTitle}</h2>
      <form action={action} className="space-y-2">
        <input type="hidden" name="storeId" value={storeId} />
        {vendorId ? (
          <input type="hidden" name="vendorId" value={vendorId} />
        ) : null}
        <label className="block text-sm">
          {labels.inviteEmail}
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          Ruolo
          <select
            name="role"
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
            defaultValue="store_manager"
          >
            <option value="store_manager">{labels.inviteRoleSm}</option>
            <option value="vendor" disabled={!vendorId}>
              {labels.inviteRoleVendor}
            </option>
          </select>
        </label>
        {state.error ? (
          <StatusPanel kind="error" title={state.error} locale={locale} />
        ) : null}
        {state.ok ? (
          <p className="text-sm text-[var(--success)]" role="status">
            {labels.inviteOk}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {pending ? labels.pending : labels.inviteSubmit}
        </button>
      </form>
    </section>
  );
}
