"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AiSettingsClient(props: {
  configured: boolean;
  kind: string;
  source: string;
  model: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function ping() {
    setPending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/ai/health");
      const data = (await res.json()) as {
        ok?: boolean;
        configured?: boolean;
        models?: string[];
        error?: string;
        message?: string;
      };
      if (!data.configured) {
        setStatus(data.message ?? "Non configurato");
      } else if (data.ok) {
        setStatus(
          `OK — ${data.models?.length ? `modelli: ${data.models.slice(0, 5).join(", ")}` : "raggiungibile"}`,
        );
      } else {
        setStatus(data.error ?? "Endpoint non raggiungibile");
      }
    } catch {
      setStatus("Errore di rete");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[var(--muted-foreground)]">Stato</dt>
          <dd className="font-medium">
            {props.configured ? "Configurato" : "Solo heuristic"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">Provider</dt>
          <dd className="font-medium">{props.kind}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">Source label</dt>
          <dd className="font-medium">{props.source}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">Modello</dt>
          <dd className="font-medium">{props.model}</dd>
        </div>
      </dl>
      <Button type="button" onClick={ping} disabled={pending}>
        {pending ? "Test…" : "Test connessione"}
      </Button>
      {status ? (
        <p className="text-sm text-[var(--muted-foreground)]" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
