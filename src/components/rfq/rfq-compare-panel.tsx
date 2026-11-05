"use client";

import { useCallback, useState } from "react";
import { StatusPanel } from "@/components/ui/status-panel";
import type { MessageCatalog } from "@/i18n";

type Props = {
  requestId: string;
  labels: MessageCatalog["rfq"];
};

export function RfqComparePanel({ requestId, labels }: Props) {
  const [pending, setPending] = useState(false);
  const [comparison, setComparison] = useState<string | null>(null);
  const [prosCons, setProsCons] = useState<
    { bidId: string; vendorName: string; pros: string[]; cons: string[] }[]
  >([]);
  const [caution, setCaution] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/rfq-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? labels.compareError);
        return;
      }
      const data = (await res.json()) as {
        comparison: string;
        prosCons: typeof prosCons;
        caution: string;
        source: string;
      };
      setComparison(data.comparison);
      setProsCons(data.prosCons ?? []);
      setCaution(data.caution);
      setSource(data.source);
    } catch {
      setError(labels.compareError);
    } finally {
      setPending(false);
    }
  }, [requestId, labels.compareError]);

  return (
    <section className="mt-8 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{labels.compareTitle}</h2>
        <button
          type="button"
          className="text-xs text-[var(--primary)] underline-offset-2 hover:underline disabled:opacity-50"
          disabled={pending}
          onClick={() => void run()}
        >
          {pending ? labels.comparePending : labels.compareBtn}
        </button>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">{labels.compareHint}</p>
      {pending && !comparison ? (
        <StatusPanel kind="loading" title={labels.comparePending} />
      ) : null}
      {error ? <StatusPanel kind="error" title={error} /> : null}
      {comparison ? (
        <div className="space-y-3 rounded-md border border-[var(--border)] px-3 py-2 text-sm">
          <p>{comparison}</p>
          {prosCons.map((row) => (
            <div key={row.bidId} className="text-xs">
              <p className="font-medium">{row.vendorName}</p>
              <p className="text-[var(--muted-foreground)]">
                + {row.pros.join("; ") || "—"}
              </p>
              <p className="text-[var(--muted-foreground)]">
                − {row.cons.join("; ") || "—"}
              </p>
            </div>
          ))}
          {caution ? (
            <p className="text-[10px] text-[var(--muted-foreground)]">{caution}</p>
          ) : null}
          {source ? (
            <p className="text-[10px] text-[var(--muted-foreground)]">
              {labels.compareSource}: {source}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
