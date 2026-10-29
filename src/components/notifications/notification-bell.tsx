"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusPanel } from "@/components/ui/status-panel";
import type { Locale, MessageCatalog } from "@/i18n";

type Item = {
  id: string;
  type: string;
  ticketId: string | null;
  readAt: string | null;
  createdAt: string;
};

type Props = {
  role?: string | null;
  labels: MessageCatalog["notifBell"];
  dateLocale?: string;
  locale?: Locale;
};

function ticketHref(role: string | null | undefined, ticketId: string) {
  if (role === "vendor") return `/vendor/tickets/${ticketId}`;
  return `/app/tickets/${ticketId}`;
}

function typeLabel(
  labels: MessageCatalog["notifBell"],
  type: string,
): string {
  const map: Record<string, string> = {
    "ticket.created": labels.evtCreated,
    "ticket.assigned": labels.evtAssigned,
    "ticket.cancelled": labels.evtCancelled,
    "ticket.done": labels.evtDone,
    "ticket.breached": labels.evtBreached,
    "ticket.verified": labels.evtVerified,
    "ticket.rejected": labels.evtRejected,
  };
  return map[type] ?? type;
}

export function NotificationBell({
  role,
  labels,
  dateLocale = "it-IT",
  locale = "it",
}: Props) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Item[]>([]);

  const refreshCount = useCallback(async () => {
    if (document.visibilityState === "hidden") return;
    const res = await fetch("/api/notifications/unread-count", {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as { count?: number };
    setCount(data.count ?? 0);
  }, []);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { items: Item[] };
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    void refreshCount();
    const id = setInterval(() => void refreshCount(), 30_000);
    const onFocus = () => void refreshCount();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refreshCount]);

  async function openPanel() {
    setOpen((v) => !v);
    if (!open) await loadList();
  }

  async function markOne(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    await Promise.all([loadList(), refreshCount()]);
  }

  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    await Promise.all([loadList(), refreshCount()]);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void openPanel()}
        className="relative rounded-[var(--radius)] border border-[var(--border)] px-3 py-1.5 text-sm"
        aria-label={labels.aria}
      >
        {labels.title}
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[var(--critical)] px-1 text-center text-[10px] font-semibold text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-[var(--radius)] border border-[var(--border)] bg-white p-3 shadow-md">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{labels.title}</p>
            <button
              type="button"
              onClick={() => void markAll()}
              className="text-xs text-[var(--primary)] underline-offset-2 hover:underline"
            >
              {labels.markAll}
            </button>
          </div>
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {items.length === 0 ? (
              <li className="list-none py-1">
                <StatusPanel
                  kind="empty"
                  title={labels.empty}
                  locale={locale}
                />
              </li>
            ) : (
              items.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-[var(--radius)] px-2 py-2 text-sm ${
                    n.readAt ? "opacity-70" : "bg-[var(--muted)]/40"
                  }`}
                >
                  <p className="font-medium">{typeLabel(labels, n.type)}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {new Date(n.createdAt).toLocaleString(dateLocale)}
                  </p>
                  <div className="mt-1 flex gap-2">
                    {n.ticketId ? (
                      <Link
                        href={ticketHref(role, n.ticketId)}
                        onClick={() => void markOne(n.id)}
                        className="text-xs font-medium text-[var(--primary)] underline-offset-2 hover:underline"
                      >
                        {labels.openTicket}
                      </Link>
                    ) : null}
                    {!n.readAt ? (
                      <button
                        type="button"
                        onClick={() => void markOne(n.id)}
                        className="text-xs text-[var(--muted-foreground)] underline-offset-2 hover:underline"
                      >
                        {labels.markRead}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
