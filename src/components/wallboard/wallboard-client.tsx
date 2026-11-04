"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  intakeCategoryLabel,
  intakePriorityLabel,
} from "@/domain/intake/chat-steps";
import { ticketStatusLabel } from "@/lib/labels/ticket-status";
import type { Locale, MessageCatalog } from "@/i18n";

function openedAgo(
  openedAtIso: string,
  copy: MessageCatalog["wallboard"],
): string {
  const ms = Date.now() - new Date(openedAtIso).getTime();
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  if (minutes < 60) return copy.agoMinutes.replace("{n}", String(minutes));
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return copy.agoHours.replace("{n}", String(hours));
  const days = Math.floor(hours / 24);
  return copy.agoDays.replace("{n}", String(days));
}

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
  copy: MessageCatalog["wallboard"];
  locale: Locale;
}) {
  const { copy, locale } = props;
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), 30_000);
    return () => window.clearInterval(id);
  }, [router]);

  const count = props.tickets.length;

  return (
    <div className="min-h-dvh bg-[var(--background)] p-6" data-tour="hq.wallboard">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-3xl">
          <h1 className="font-[family-name:var(--font-sora)] text-3xl font-semibold text-[var(--primary)] sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-2 text-base text-[var(--muted-foreground)] sm:text-lg">
            {copy.subtitle}
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {copy.refreshHint}
          </p>
        </div>
        <div
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-right"
          aria-label={copy.countAria.replace("{n}", String(count))}
        >
          <p className="text-sm font-medium text-[var(--muted-foreground)]">
            {copy.countLabel}
          </p>
          <p className="text-5xl font-semibold tabular text-[var(--foreground)]">
            {count}
          </p>
        </div>
      </header>

      {count === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--card)] p-8">
          <p className="font-[family-name:var(--font-sora)] text-xl font-semibold">
            {copy.emptyTitle}
          </p>
          <p className="mt-2 text-[var(--muted-foreground)]">{copy.emptyBody}</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {props.tickets.map((t) => {
            const category = intakeCategoryLabel(t.category, locale);
            const priority = intakePriorityLabel(t.priority, locale);
            const status = ticketStatusLabel(t.status, locale);
            return (
              <li
                key={t.id}
                className={
                  t.breached
                    ? "rounded-[var(--radius)] border border-[color-mix(in_oklab,var(--critical)_40%,var(--border))] bg-[color-mix(in_oklab,var(--critical)_10%,var(--card))] p-5"
                    : "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-5"
                }
              >
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  {copy.storeLabel}
                </p>
                <p className="font-[family-name:var(--font-sora)] text-xl font-semibold text-[var(--foreground)]">
                  {t.storeName}
                </p>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-[var(--muted-foreground)]">
                      {copy.categoryLabel}
                    </dt>
                    <dd className="font-medium">{category}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-[var(--muted-foreground)]">
                      {copy.priorityLabel}
                    </dt>
                    <dd className="font-medium">{priority}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-[var(--muted-foreground)]">
                      {copy.statusLabel}
                    </dt>
                    <dd className="font-medium">{status}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-[var(--muted-foreground)]">
                      {copy.openedLabel}
                    </dt>
                    <dd className="font-medium tabular">
                      {openedAgo(t.openedAt, copy)}
                    </dd>
                  </div>
                </dl>

                <p
                  className={
                    t.breached
                      ? "mt-4 text-base font-semibold text-[var(--critical)]"
                      : "mt-4 text-base font-medium text-[var(--muted-foreground)]"
                  }
                >
                  {t.breached ? copy.breachedBadge : copy.onTrackBadge}
                </p>

                <Link
                  href={`/app/tickets/${t.id}`}
                  className="mt-4 inline-block text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
                >
                  {copy.openTicket}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
