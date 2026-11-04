"use client";

import { buildWeekDays, sameYmd, toYmd } from "@/lib/calendar/grid";
import { cn } from "@/lib/utils";
import type { PmCalendarEvent } from "./pm-calendar-types";
import { eventBlockClass, timeLabel } from "./pm-calendar-shared";

export function WeekView(props: {
  anchor: Date;
  today: Date;
  eventsByDay: Map<string, PmCalendarEvent[]>;
  weekdays: readonly string[];
  dateLocale: string;
  isOverdue: (iso: string) => boolean;
  onOpenDay: (d: Date, el: HTMLElement) => void;
  onOpenEvent: (id: string, el: HTMLElement) => void;
}) {
  const days = buildWeekDays(props.anchor);

  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]">
      <div className="grid min-w-[52rem] grid-cols-7 divide-x divide-[var(--border)]">
        {days.map((day, i) => {
          const key = toYmd(day);
          const dayEvents = props.eventsByDay.get(key) ?? [];
          const isToday = sameYmd(day, props.today);
          return (
            <div
              key={key}
              className="min-h-[22rem] cursor-pointer p-2 hover:bg-[var(--muted)]/20"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                props.onOpenDay(day, e.currentTarget);
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onOpenDay(
                    day,
                    e.currentTarget.parentElement ?? e.currentTarget,
                  );
                }}
                className="mb-3 flex w-full flex-col items-center gap-1 rounded-[var(--radius)] px-1 py-2 hover:bg-[var(--muted)]/50"
                aria-label={day.toLocaleDateString(props.dateLocale, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              >
                <span className="text-[length:var(--text-caption)] uppercase tracking-wide text-[var(--muted-foreground)]">
                  {props.weekdays[i]}
                </span>
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-base tabular",
                    isToday &&
                      "bg-[var(--primary)] font-semibold text-[var(--primary-foreground)]",
                  )}
                  aria-current={isToday ? "date" : undefined}
                >
                  {day.getDate()}
                </span>
              </button>
              <div className="space-y-1">
                {dayEvents.length === 0 ? (
                  <p className="px-1 text-xs text-[var(--muted-foreground)]">
                    —
                  </p>
                ) : (
                  dayEvents.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onOpenEvent(ev.id, e.currentTarget);
                      }}
                      className={cn(
                        "w-full rounded-[var(--radius)] border px-2 py-1.5 text-left text-xs",
                        eventBlockClass(props.isOverdue(ev.scheduledAt)),
                      )}
                    >
                      <span className="block tabular text-[10px] opacity-80">
                        {timeLabel(ev.scheduledAt, props.dateLocale)}
                      </span>
                      <span className="font-medium">{ev.title}</span>
                      <span className="mt-0.5 block truncate text-[var(--muted-foreground)]">
                        {ev.storeName}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
