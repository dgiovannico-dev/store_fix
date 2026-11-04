"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StatusPanel } from "@/components/ui/status-panel";
import type { Locale, MessageCatalog } from "@/i18n";

type Props = {
  ticketId: string;
  canOps: boolean;
  labels: MessageCatalog["ticketPanels"];
  locale?: Locale;
  /** Genera riassunto + soluzione al mount (es. apertura dettaglio). */
  autoGenerate?: boolean;
};

export function SummarizeNotesPanel({
  ticketId,
  canOps,
  labels,
  locale = "it",
  autoGenerate = true,
}: Props) {
  const [pending, setPending] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ranAuto = useRef(false);

  const runAssist = useCallback(
    async (signal?: AbortSignal) => {
      setPending(true);
      setError(null);
      try {
        const res = await fetch("/api/ai/summarize-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId }),
          signal,
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
          suggestedSolution?: string;
          source: string;
        };
        setSummary(data.summary);
        setSolution(data.suggestedSolution ?? null);
        setSource(data.source);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(labels.summarizeError);
      } finally {
        setPending(false);
      }
    },
    [ticketId, labels.summarizeError],
  );

  useEffect(() => {
    if (!canOps || !autoGenerate || ranAuto.current) return;
    ranAuto.current = true;
    const ac = new AbortController();
    void runAssist(ac.signal);
    return () => ac.abort();
  }, [canOps, autoGenerate, runAssist]);

  if (!canOps) return null;

  return (
    <section className="space-y-3">
      <h2 className="sr-only">{labels.summarizeTitle}</h2>
      <p className="text-xs text-[var(--muted-foreground)]">
        {labels.summarizeHint}
      </p>
      {pending && !summary ? (
        <StatusPanel
          kind="loading"
          title={labels.summarizeAutoPending}
          locale={locale}
        />
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => void runAssist()}
        className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pending ? labels.summarizePending : labels.summarizeBtn}
      </button>
      {error ? (
        <StatusPanel kind="error" title={error} locale={locale} />
      ) : null}
      {summary ? (
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-3 text-sm whitespace-pre-wrap">
          <p className="mb-2 text-xs text-[var(--muted-foreground)]">
            {labels.summarizeSource} {source} · {labels.summarizeNeedsConfirm}
          </p>
          {summary}
        </div>
      ) : null}
      {solution ? (
        <div className="rounded-[var(--radius)] border border-[color-mix(in_oklab,var(--signal)_35%,var(--border))] bg-[color-mix(in_oklab,var(--signal)_6%,var(--card))] p-3 text-sm whitespace-pre-wrap">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {labels.summarizeSolutionTitle}
          </p>
          <p className="mb-2 text-xs text-[var(--muted-foreground)]">
            {labels.summarizeNeedsConfirm}
          </p>
          {solution}
        </div>
      ) : null}
    </section>
  );
}
