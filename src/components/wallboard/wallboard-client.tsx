"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function WallboardClient(props: {
  tickets: {
    id: string;
    storeName: string;
    category: string;
    priority: string;
    status: string;
    breached: boolean;
    openedAt: string;
  }[];
}) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), 30_000);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <div className="min-h-dvh bg-[var(--background)] p-6" data-tour="hq.wallboard">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-3xl font-semibold text-[var(--primary)]">
            Wallboard
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Aperti e breach — refresh automatico 30s
          </p>
        </div>
        <p className="text-4xl font-semibold tabular text-[var(--foreground)]">
          {props.tickets.length}
        </p>
      </header>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {props.tickets.map((t) => (
          <li
            key={t.id}
            className={
              t.breached
                ? "rounded-[var(--radius)] border border-[color-mix(in_oklab,var(--critical)_40%,var(--border))] bg-[color-mix(in_oklab,var(--critical)_10%,var(--card))] p-4"
                : "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4"
            }
          >
            <p className="font-semibold">{t.storeName}</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {t.category} · {t.priority} · {t.status}
            </p>
            {t.breached ? (
              <p className="mt-2 text-sm font-medium text-[var(--critical)]">
                SLA breach
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
