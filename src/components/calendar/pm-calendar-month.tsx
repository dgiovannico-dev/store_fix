"use client";

import { buildMonthGrid, sameYmd, toYmd } from "@/lib/calendar/grid";
import { cn } from "@/lib/utils";
import type { PmCalendarEvent } from "./pm-calendar-types";
import { monthTitle, timeLabel } from "./pm-calendar-shared";

function EventChip(props: {
  event: PmCalendarEvent;
  overdue: boolean;
  dateLocale: string;
  onClick: (el: HTMLElement) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        props.onClick(e.currentTarget);
      }}
      className={cn(
        "flex w-full min-w-0 items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] leading-tight",
        props.overdue
          ? "bg-[color-mix(in_oklab,var(--critical)_18%,transparent)] text-[var(--critical)]"
          : "bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-[var(--primary)]",
      )}
      title={props.event.title}
    >
      <span className="shrink-0 tabular">
        {timeLabel(props.event.scheduledAt, props.dateLocale)}
      </span>
      <span className="truncate font-medium">{props.event.title}</span>
    </button>
  );
}

export function MonthView(props: {
  anchor: Date;
  today: Date;
  eventsByDay: Map<string, PmCalendarEvent[]>;
  weekdays: readonly string[];
  moreLabel: string;
  dateLocale: string;
  isOverdue: (iso: string) => boolean;
  onOpenDay: (d: Date, el: HTMLElement) => void;
  onOpenEvent: (id: string, el: HTMLElement) => void;
}) {
  const cells = buildMonthGrid(props.anchor);
  const month = props.anchor.getMonth();

  return (
    <div
      role="grid"
      aria-label={monthTitle(props.anchor, props.dateLocale)}
      className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]"
    >
      <div
        role="row"
        className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--muted)]/40"
      >
        {props.weekdays.map((d) => (
          <div
            key={d}
            role="columnheader"
            className="px-2 py-2 text-center text-[length:var(--text-caption)] font-medium uppercase tracking-wide text-[var(--muted-foreground)]"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-[minmax(6.5rem,1fr)]">
        {cells.map((day) => {
          const key = toYmd(day);
          const dayEvents = props.eventsByDay.get(key) ?? [];
          const inMonth = day.getMonth() === month;
          const isToday = sameYmd(day, props.today);
          const visible = dayEvents.slice(0, 3);
          const rest = dayEvents.length - visible.length;

          return (
            <div
              key={key}
              role="gridcell"
              tabIndex={0}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                props.onOpenDay(day, e.currentTarget);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  props.onOpenDay(day, e.currentTarget);
                }
              }}
              className={cn(
                "min-h-[6.5rem] cursor-pointer border-b border-r border-[var(--border)] p-1.5 last:border-r-0 hover:bg-[var(--muted)]/25",
                !inMonth && "bg-[var(--muted)]/20",
              )}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onOpenDay(
                    day,
                    (e.currentTarget.closest(
                      '[role="gridcell"]',
                    ) as HTMLElement) ?? e.currentTarget,
                  );
                }}
                className={cn(
                  "mb-1 flex size-7 items-center justify-center rounded-full text-sm tabular hover:bg-[var(--muted)]",
                  !inMonth && "text-[var(--muted-foreground)]",
                  isToday &&
                    "bg-[var(--primary)] font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary)]",
                )}
                aria-label={day.toLocaleDateString(props.dateLocale, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                aria-current={isToday ? "date" : undefined}
              >
                {day.getDate()}
              </button>
              <div className="space-y-0.5">
                {visible.map((ev) => (
                  <EventChip
                    key={ev.id}
                    event={ev}
                    overdue={props.isOverdue(ev.scheduledAt)}
                    dateLocale={props.dateLocale}
                    onClick={(el) => props.onOpenEvent(ev.id, el)}
                  />
                ))}
                {rest > 0 ? (
                  <button
                    type="button"
                    className="w-full px-1 text-left text-[11px] font-medium text-[var(--muted-foreground)] hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onOpenDay(
                        day,
                        (e.currentTarget.closest(
                          '[role="gridcell"]',
                        ) as HTMLElement) ?? e.currentTarget,
                      );
                    }}
                  >
                    {props.moreLabel.replace("{n}", String(rest))}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
