"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { StatusPanel } from "@/components/ui/status-panel";
import type { MessageCatalog } from "@/i18n";

type Hit = {
  ticketId: string;
  score: number;
  category: string;
  status: string;
  snippet: string;
  storeCode: string | null;
};

type Props = {
  ticketId: string;
  canOps: boolean;
  labels: MessageCatalog["ticketPanels"];
};

export function SimilarTicketsPanel({ ticketId, canOps, labels }: Props) {
  const [pending, setPending] = useState(false);
  const [items, setItems] = useState<Hit[] | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ranAuto = useRef(false);

  const run = useCallback(
    async (signal?: AbortSignal) => {
      setPending(true);
      setError(null);
      try {
        const res = await fetch("/api/ai/similar-tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId }),
          signal,
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(j.error ?? labels.similarError);
          return;
        }
        const data = (await res.json()) as {
          items: Hit[];
          source: string;
        };
        setItems(data.items);
        setSource(data.source);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(labels.similarError);
      } finally {
        setPending(false);
      }
    },
    [ticketId, labels.similarError],
  );

  useEffect(() => {
    if (!canOps || ranAuto.current) return;
    ranAuto.current = true;
    const ac = new AbortController();
    void run(ac.signal);
    return () => ac.abort();
  }, [canOps, run]);

  if (!canOps) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-[var(--foreground)]">
          {labels.similarTitle}
        </h2>
        <button
          type="button"
          className="text-xs text-[var(--primary)] underline-offset-2 hover:underline disabled:opacity-50"
          disabled={pending}
          onClick={() => void run()}
        >
          {pending ? labels.similarPending : labels.similarBtn}
        </button>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        {labels.similarHint}
      </p>
      {pending && !items ? (
        <StatusPanel kind="loading" title={labels.similarPending} />
      ) : null}
      {error ? <StatusPanel kind="error" title={error} /> : null}
      {items && items.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          {labels.similarEmpty}
        </p>
      ) : null}
      {items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((hit) => (
            <li
              key={hit.ticketId}
              className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/app/tickets/${hit.ticketId}`}
                  className="font-medium text-[var(--primary)] underline-offset-2 hover:underline"
                >
                  {hit.ticketId.slice(0, 8)}…
                  {hit.storeCode ? ` · ${hit.storeCode}` : ""}
                </Link>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {(hit.score * 100).toFixed(0)}% · {hit.category} ·{" "}
                  {hit.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-2">
                {hit.snippet}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
      {source ? (
        <p className="text-[10px] text-[var(--muted-foreground)]">
          {labels.summarizeSource} {source} — {labels.summarizeNeedsConfirm}
        </p>
      ) : null}
    </section>
  );
}
