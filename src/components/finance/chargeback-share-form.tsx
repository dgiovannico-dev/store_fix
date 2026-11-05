"use client";

import { useActionState } from "react";
import {
  shareChargebackAction,
  type ChargebackShareState,
} from "@/app/actions/chargeback-share";
import type { MessageCatalog } from "@/i18n";

const initial: ChargebackShareState = {};

export function ChargebackShareForm(props: {
  days: number;
  copy: MessageCatalog["chargeback"];
}) {
  const [state, action, pending] = useActionState(
    shareChargebackAction,
    initial,
  );
  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-2 rounded-[var(--radius)] border border-[var(--border)] p-3"
    >
      <input type="hidden" name="days" value={props.days} />
      <div className="min-w-[12rem] flex-1">
        <p className="text-xs font-medium">{props.copy.shareCfoTitle}</p>
        <label className="mt-1 block text-xs text-[var(--muted-foreground)]">
          {props.copy.shareCfoEmail}
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-[var(--radius)] bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
      >
        {props.copy.shareCfoSubmit}
      </button>
      {state.ok ? (
        <p className="w-full text-xs text-[var(--success)]">
          {props.copy.shareCfoOk}
        </p>
      ) : null}
      {state.error ? (
        <p className="w-full text-xs text-[var(--destructive)]">{state.error}</p>
      ) : null}
    </form>
  );
}
