"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { breachPlaybookAction } from "@/app/actions/breach-playbook";
import type { MessageCatalog } from "@/i18n";

type Props = {
  ticketId: string;
  breached: boolean;
  canOps: boolean;
  labels: MessageCatalog["ticketPanels"];
};

/** F9-04 — primary one-click breach playbook CTA. */
export function BreachPlaybookPanel({
  ticketId,
  breached,
  canOps,
  labels,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (!canOps || !breached) return null;

  return (
    <section className="space-y-2 rounded-[var(--radius)] border border-[color-mix(in_oklab,var(--destructive)_35%,var(--border))] bg-[color-mix(in_oklab,var(--destructive)_6%,var(--card))] p-3">
      <h2 className="text-sm font-semibold">{labels.playbookTitle}</h2>
      <p className="text-xs text-[var(--muted-foreground)]">
        {labels.playbookHint}
      </p>
      <button
        type="button"
        disabled={pending}
        className="rounded-[var(--radius)] bg-[var(--destructive)] px-4 py-2 text-sm font-medium text-[var(--destructive-foreground)] disabled:opacity-60"
        onClick={() => {
          start(async () => {
            await breachPlaybookAction(ticketId);
            router.refresh();
          });
        }}
      >
        {pending ? labels.pending : labels.playbookCta}
      </button>
    </section>
  );
}
