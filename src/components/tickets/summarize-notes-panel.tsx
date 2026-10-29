"use client";

import { useState } from "react";
import type { MessageCatalog } from "@/i18n";

type Props = {
  ticketId: string;
  canOps: boolean;
  labels: MessageCatalog["ticketPanels"];
};

export function SummarizeNotesPanel({ ticketId, canOps, labels }: Props) {
  const [pending, setPending] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!canOps) return null;

  return (
    <section className="mt-6 space-y-2 border-t border-[var(--border)] pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {labels.summarizeTitle}
      </h2>
      <p className="text-xs text-[var(--muted-foreground)]">
        {labels.summarizeHint}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const res = await fetch("/api/ai/summarize-ticket", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ticketId }),
            });
            if (!res.ok) {
              const j = (await res.json().catch(() => ({}))) as {
                error?: string;
              };
              setError(j.error ?? labels.summarizeError);
              return;
            }
            const data = (await res.json()) as {
              summary: string;
              source: string;
            };
            setSummary(data.summary);
            setSource(data.source);
          } finally {
            setPending(false);
          }
        }}
        className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pending ? labels.summarizePending : labels.summarizeBtn}
      </button>
      {error ? (
        <p className="text-sm text-[var(--critical)]" role="alert">
          {error}
        </p>
      ) : null}
      {summary ? (
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-3 text-sm whitespace-pre-wrap">
          <p className="mb-2 text-xs text-[var(--muted-foreground)]">
            {labels.summarizeSource} {source} · needsConfirm
          </p>
          {summary}
        </div>
      ) : null}
    </section>
  );
}
