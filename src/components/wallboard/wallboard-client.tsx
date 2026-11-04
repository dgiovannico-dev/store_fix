"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  intakeCategoryLabel,
  intakePriorityLabel,
} from "@/domain/intake/chat-steps";
import { ticketStatusLabel } from "@/lib/labels/ticket-status";
import type { Locale, MessageCatalog } from "@/i18n";

const PAGE_SIZE = 24;

type WallboardCard = {
  id: string;
  storeName: string;
  category: string;
  priority: string;
  status: string;
  breached: boolean;
  openedAt: string;
};

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
  initialTickets: WallboardCard[];
  initialTotal: number;
  initialNextSkip: number | null;
  copy: MessageCatalog["wallboard"];
  locale: Locale;
}) {
  const { copy, locale } = props;
  const [tickets, setTickets] = useState(props.initialTickets);
  const [total, setTotal] = useState(props.initialTotal);
  const [nextSkip, setNextSkip] = useState(props.initialNextSkip);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (nextSkip == null || loadingRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/wallboard?skip=${nextSkip}&take=${PAGE_SIZE}`,
      );
      if (!res.ok) {
        setLoadError(copy.loadMoreError);
        return;
      }
      const data = (await res.json()) as {
        items: WallboardCard[];
        total: number;
        nextSkip: number | null;
      };
      setTickets((prev) => {
        const seen = new Set(prev.map((t) => t.id));
        const appended = data.items.filter((t) => !seen.has(t.id));
        return [...prev, ...appended];
      });
      setTotal(data.total);
      setNextSkip(data.nextSkip);
    } catch {
      setLoadError(copy.loadMoreError);
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [nextSkip, copy.loadMoreError]);

  // Soft refresh first page every 30s without discarding already-loaded cards.
  useEffect(() => {
    const id = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/wallboard?skip=0&take=${PAGE_SIZE}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          items: WallboardCard[];
          total: number;
          nextSkip: number | null;
        };
        setTotal(data.total);
        setTickets((prev) => {
          const onlyFirstPage = prev.length <= PAGE_SIZE;
          const freshIds = new Set(data.items.map((t) => t.id));
          const rest = prev
            .slice(PAGE_SIZE)
            .filter((t) => !freshIds.has(t.id));
          if (onlyFirstPage) {
            setNextSkip(data.nextSkip);
          }
          return [...data.items, ...rest];
        });
      } catch {
        /* keep current list on soft-refresh failure */
      }
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || nextSkip == null) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "240px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore, nextSkip]);

  const count = total;
  const returnTo = encodeURIComponent("/app/wallboard");

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
          {count > 0 ? (
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {copy.showingOf
                .replace("{shown}", String(tickets.length))
                .replace("{total}", String(count))}
            </p>
          ) : null}
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
        <>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tickets.map((t) => {
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
                  style={{
                    contentVisibility: "auto",
                    containIntrinsicSize: "280px",
                  }}
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
                    href={`/app/tickets/${t.id}?returnTo=${returnTo}`}
                    className="mt-4 inline-block text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
                  >
                    {copy.openTicket}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div ref={sentinelRef} className="h-8" aria-hidden />

          {loadingMore ? (
            <ul
              className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              aria-busy="true"
              aria-live="polite"
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={`skel-${i}`}
                  className="h-56 animate-pulse rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)]"
                />
              ))}
            </ul>
          ) : null}

          {nextSkip != null ? (
            <div className="mt-2 flex justify-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void loadMore()}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {loadingMore ? copy.loadMorePending : copy.loadMore}
              </button>
            </div>
          ) : null}
          {loadError ? (
            <p className="mt-2 text-center text-sm text-[var(--critical)]" role="alert">
              {loadError}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
