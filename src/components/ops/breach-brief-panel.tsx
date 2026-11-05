"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { StatusPanel } from "@/components/ui/status-panel";
import type { MessageCatalog } from "@/i18n";

type Props = {
  ticketId: string;
  breached: boolean;
  canOps: boolean;
  labels: MessageCatalog["ticketPanels"];
};

export function BreachBriefPanel({
  ticketId,
  breached,
  canOps,
  labels,
}: Props) {
  const [pending, setPending] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [citations, setCitations] = useState<{ ticketId: string }[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/breach-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? labels.breachBriefError);
        return;
      }
      const data = (await res.json()) as {
        brief: string;
        suggestedActions: string[];
        citations: { ticketId: string }[];
        source: string;
      };
      setBrief(data.brief);
      setActions(data.suggestedActions ?? []);
      setCitations(data.citations ?? []);
      setSource(data.source);
    } catch {
      setError(labels.breachBriefError);
    } finally {
      setPending(false);
    }
  }, [ticketId, labels.breachBriefError]);

  if (!canOps || !breached) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-sora)] text-sm font-semibold tracking-tight">
          {labels.breachBriefTitle}
        </h2>
        <button
          type="button"
          className="text-xs text-[var(--primary)] underline-offset-2 hover:underline disabled:opacity-50"
          disabled={pending}
          onClick={() => void run()}
        >
          {pending ? labels.breachBriefPending : labels.breachBriefBtn}
        </button>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        {labels.breachBriefHint}
      </p>
      {pending && !brief ? (
        <StatusPanel kind="loading" title={labels.breachBriefPending} />
      ) : null}
      {error ? <StatusPanel kind="error" title={error} /> : null}
      {brief ? (
        <div className="space-y-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm">
          <p>{brief}</p>
          {actions.length > 0 ? (
            <ul className="list-disc pl-4 text-xs text-[var(--muted-foreground)]">
              {actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          ) : null}
          {citations.length > 0 ? (
            <p className="text-xs">
              {citations.map((c) => (
                <Link
                  key={c.ticketId}
                  href={`/app/tickets/${c.ticketId}`}
                  className="mr-2 text-[var(--primary)] underline-offset-2 hover:underline"
                >
                  {c.ticketId.slice(0, 8)}…
                </Link>
              ))}
            </p>
          ) : null}
          {source ? (
            <p className="text-[10px] text-[var(--muted-foreground)]">
              {labels.summarizeSource} {source} — {labels.summarizeNeedsConfirm}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
