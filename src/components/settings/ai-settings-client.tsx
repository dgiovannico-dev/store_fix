"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusPanel } from "@/components/ui/status-panel";
import type { Locale, MessageCatalog } from "@/i18n";

export function AiSettingsClient(props: {
  configured: boolean;
  kind: string;
  source: string;
  model: string;
  usageCount: number;
  usageLimit: number;
  usageSoftExceeded: boolean;
  labels: MessageCatalog["settingsAi"];
  locale?: Locale;
}) {
  const { labels, locale = "it" } = props;
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
        setStatus(data.message ?? labels.pingNotConfigured);
      } else if (data.ok) {
        setStatus(
          data.models?.length
            ? labels.pingOkModels.replace(
                "{models}",
                data.models.slice(0, 5).join(", "),
              )
            : labels.pingOkReachable,
        );
      } else {
        setStatus(data.error ?? labels.pingUnreachable);
      }
    } catch {
      setStatus(labels.pingNetworkError);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[var(--muted-foreground)]">{labels.statusLabel}</dt>
          <dd className="font-medium">
            {props.configured
              ? labels.configuredYes
              : labels.configuredHeuristic}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">
            {labels.providerLabel}
          </dt>
          <dd className="font-medium">{props.kind}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">{labels.sourceLabel}</dt>
          <dd className="font-medium">{props.source}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">{labels.modelLabel}</dt>
          <dd className="font-medium">{props.model}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[var(--muted-foreground)]">{labels.usageLabel}</dt>
          <dd className="font-medium">
            {labels.usageValue
              .replace("{count}", String(props.usageCount))
              .replace("{limit}", String(props.usageLimit))}
            {props.usageSoftExceeded ? (
              <span className="ml-2 text-xs text-[var(--destructive)]">
                {labels.usageSoftExceeded}
              </span>
            ) : null}
          </dd>
        </div>
      </dl>
      <Button type="button" onClick={ping} disabled={pending}>
        {pending ? labels.testing : labels.testConnection}
      </Button>
      {pending ? (
        <StatusPanel kind="loading" title={labels.testing} locale={locale} />
      ) : status ? (
        <p className="text-sm text-[var(--muted-foreground)]" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
