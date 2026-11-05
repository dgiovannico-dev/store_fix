"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { StatusPanel } from "@/components/ui/status-panel";

type Props = {
  title: string;
  hint: string;
  btn: string;
  pendingLabel: string;
  errorLabel: string;
  sourceLabel: string;
  confirmLabel: string;
};

export function DigestNarrativePanel({
  title,
  hint,
  btn,
  pendingLabel,
  errorLabel,
  sourceLabel,
  confirmLabel,
}: Props) {
  const [pending, setPending] = useState(false);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [citations, setCitations] = useState<
    { ticketId: string; reason: string }[]
  >([]);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/digest-narrative", { method: "POST" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? errorLabel);
        return;
      }
      const data = (await res.json()) as {
        narrative: string;
        citations: { ticketId: string; reason: string }[];
        source: string;
      };
      setNarrative(data.narrative);
      setCitations(data.citations ?? []);
      setSource(data.source);
    } catch {
      setError(errorLabel);
    } finally {
      setPending(false);
    }
  }, [errorLabel]);

  return (
    <section className="space-y-2 rounded-md border border-[var(--border)] p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button
          type="button"
          className="text-xs text-[var(--primary)] underline-offset-2 hover:underline disabled:opacity-50"
          disabled={pending}
          onClick={() => void run()}
        >
          {pending ? pendingLabel : btn}
        </button>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>
      {pending && !narrative ? (
        <StatusPanel kind="loading" title={pendingLabel} />
      ) : null}
      {error ? <StatusPanel kind="error" title={error} /> : null}
      {narrative ? (
        <div className="space-y-2 text-sm">
          <p>{narrative}</p>
          {citations.length > 0 ? (
            <ul className="text-xs text-[var(--muted-foreground)]">
              {citations.map((c) => (
                <li key={c.ticketId}>
                  <Link
                    href={`/app/tickets/${c.ticketId}`}
                    className="text-[var(--primary)] underline-offset-2 hover:underline"
                  >
                    {c.ticketId.slice(0, 8)}…
                  </Link>{" "}
                  — {c.reason}
                </li>
              ))}
            </ul>
          ) : null}
          {source ? (
            <p className="text-[10px] text-[var(--muted-foreground)]">
              {sourceLabel} {source} — {confirmLabel}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
