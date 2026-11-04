"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  CheckCheck,
  CircleSlash,
  ClipboardCheck,
  TicketPlus,
  UserCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { StatusPanel } from "@/components/ui/status-panel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDateTime, type Locale, type MessageCatalog } from "@/i18n";

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
  currency?: string;
  locale?: Locale;
};

type TypeVisual = {
  icon: LucideIcon;
  iconClass: string;
  washClass: string;
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

function typeVisual(type: string): TypeVisual {
  switch (type) {
    case "ticket.breached":
      return {
        icon: AlertTriangle,
        iconClass: "text-[var(--critical)]",
        washClass: "bg-[var(--critical-soft)]",
      };
    case "ticket.rejected":
      return {
        icon: XCircle,
        iconClass: "text-[var(--signal-foreground)]",
        washClass: "bg-[var(--signal-soft)]",
      };
    case "ticket.cancelled":
      return {
        icon: CircleSlash,
        iconClass: "text-[var(--muted-foreground)]",
        washClass: "bg-[var(--muted)]",
      };
    case "ticket.done":
      return {
        icon: ClipboardCheck,
        iconClass: "text-[var(--success)]",
        washClass: "bg-[var(--success-soft)]",
      };
    case "ticket.verified":
      return {
        icon: BadgeCheck,
        iconClass: "text-[var(--success)]",
        washClass: "bg-[var(--success-soft)]",
      };
    case "ticket.assigned":
      return {
        icon: UserCheck,
        iconClass: "text-[var(--info)]",
        washClass: "bg-[var(--info-soft)]",
      };
    case "ticket.created":
    default:
      return {
        icon: TicketPlus,
        iconClass: "text-[var(--info)]",
        washClass: "bg-[var(--info-soft)]",
      };
  }
}

function badgeCount(n: number) {
  if (n > 9) return "9+";
  return String(n);
}

export function NotificationBell({
  role,
  labels,
  dateLocale = "it-IT",
  currency = "EUR",
  locale = "it",
}: Props) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [mutating, setMutating] = useState(false);

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
    setListLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: Item[] };
      setItems(data.items ?? []);
    } finally {
      setListLoading(false);
    }
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

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) await loadList();
  }

  async function markOne(id: string) {
    if (mutating) return;
    setMutating(true);
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      await Promise.all([loadList(), refreshCount()]);
    } finally {
      setMutating(false);
    }
  }

  async function markAll() {
    if (mutating) return;
    setMutating(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      await Promise.all([loadList(), refreshCount()]);
    } finally {
      setMutating(false);
    }
  }

  const aria =
    count > 0 ? `${labels.aria}, ${count}` : labels.aria;

  return (
    <DropdownMenu open={open} onOpenChange={(v) => void onOpenChange(v)}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative size-10 shrink-0"
          aria-label={aria}
        >
          <Bell className="size-[1.15rem] stroke-[1.75]" aria-hidden />
          {count > 0 ? (
            <span
              className={cn(
                "notif-badge absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1",
                "bg-[var(--critical)] text-[10px] font-semibold leading-none text-[var(--critical-foreground)]",
                "tabular shadow-sm ring-2 ring-[var(--card)]",
              )}
            >
              {badgeCount(count)}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[22rem] max-w-[calc(100vw-1.5rem)] p-0"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <p className="font-[family-name:var(--font-sora)] text-sm font-semibold tracking-tight">
              {labels.title}
            </p>
            {count > 0 ? (
              <span className="rounded-md bg-[var(--critical-soft)] px-1.5 py-0.5 text-[length:var(--text-caption)] font-medium tabular text-[var(--critical)]">
                {count}
              </span>
            ) : null}
          </div>
          {count > 0 ? (
            <button
              type="button"
              disabled={mutating || listLoading}
              onClick={() => void markAll()}
              className="inline-flex items-center gap-1 text-[length:var(--text-caption)] font-medium text-[var(--primary)] underline-offset-2 hover:underline disabled:opacity-60"
            >
              <CheckCheck className="size-3.5 stroke-[1.75]" aria-hidden />
              {labels.markAll}
            </button>
          ) : null}
        </div>

        <ul className="max-h-80 overflow-y-auto p-1.5">
          {listLoading ? (
            <li className="list-none py-2">
              <StatusPanel
                kind="loading"
                locale={locale}
                className="py-8"
              />
            </li>
          ) : items.length === 0 ? (
            <li className="list-none py-2">
              <StatusPanel
                kind="empty"
                title={labels.empty}
                locale={locale}
                className="py-8"
              />
            </li>
          ) : (
            items.map((n) => {
              const visual = typeVisual(n.type);
              const Icon = visual.icon;
              const unread = !n.readAt;
              return (
                <li key={n.id}>
                  <div
                    className={cn(
                      "flex gap-2.5 rounded-[var(--radius)] px-2 py-2.5 transition-colors",
                      unread
                        ? "bg-[var(--muted)]/55"
                        : "hover:bg-[var(--muted)]/35",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
                        visual.washClass,
                      )}
                    >
                      <Icon
                        className={cn("size-4 stroke-[1.75]", visual.iconClass)}
                        aria-hidden
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <p
                          className={cn(
                            "min-w-0 flex-1 text-[length:var(--text-body-sm)] leading-snug",
                            unread
                              ? "font-semibold text-[var(--foreground)]"
                              : "font-medium text-[var(--foreground)]/90",
                          )}
                        >
                          {typeLabel(labels, n.type)}
                        </p>
                        {unread ? (
                          <span
                            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--signal)]"
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[length:var(--text-caption)] text-[var(--muted-foreground)]">
                        {formatDateTime(n.createdAt, {
                          dateLocale,
                          currency,
                        })}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                        {n.ticketId ? (
                          <Link
                            href={ticketHref(role, n.ticketId)}
                            onClick={() => void markOne(n.id)}
                            className="text-[length:var(--text-caption)] font-medium text-[var(--primary)] underline-offset-2 hover:underline"
                          >
                            {labels.openTicket}
                          </Link>
                        ) : null}
                        {unread ? (
                          <button
                            type="button"
                            disabled={mutating}
                            onClick={() => void markOne(n.id)}
                            className="text-[length:var(--text-caption)] text-[var(--muted-foreground)] underline-offset-2 hover:underline disabled:opacity-60"
                          >
                            {labels.markRead}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
