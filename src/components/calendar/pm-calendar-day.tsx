"use client";

import {
  formatHhMm,
  hoursInRange,
  minutesFromMidnight,
  sameYmd,
  toYmd,
} from "@/lib/calendar/grid";
import { cn } from "@/lib/utils";
import type { PmCalendarEvent } from "./pm-calendar-types";
import {
  DAY_HOUR_END,
  DAY_HOUR_START,
  DAY_PX_PER_HOUR,
  EVENT_VISUAL_MINUTES,
  eventBlockClass,
  parseLocal,
  timeLabel,
} from "./pm-calendar-shared";

/** Timed day grid 06:00–21:00; events as absolute blocks (~45m visual). */
export function DayView(props: {
  anchor: Date;
  today: Date;
  eventsByDay: Map<string, PmCalendarEvent[]>;
  dateLocale: string;
  outsideHoursLabel: string;
  todaySuffix: string;
  isOverdue: (iso: string) => boolean;
  onOpenSlot: (d: Date, el: HTMLElement, timeHHmm: string) => void;
  onOpenEvent: (id: string, el: HTMLElement) => void;
}) {
  const key = toYmd(props.anchor);
  const dayEvents = props.eventsByDay.get(key) ?? [];
  const hours = hoursInRange(DAY_HOUR_START, DAY_HOUR_END);
  const rangeStartMin = DAY_HOUR_START * 60;
  const rangeEndMin = (DAY_HOUR_END + 1) * 60;
  const gridHeight = hours.length * DAY_PX_PER_HOUR;
  const isToday = sameYmd(props.anchor, props.today);

  const outside = dayEvents.filter((ev) => {
    const m = minutesFromMidnight(parseLocal(ev.scheduledAt));
    return m < rangeStartMin || m >= rangeEndMin;
  });
  const timed = dayEvents.filter((ev) => {
    const m = minutesFromMidnight(parseLocal(ev.scheduledAt));
    return m >= rangeStartMin && m < rangeEndMin;
  });

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--muted)]/40 px-4 py-2">
        <p className="text-sm font-medium capitalize text-[var(--foreground)]">
          {props.anchor.toLocaleDateString(props.dateLocale, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          {isToday ? props.todaySuffix : ""}
        </p>
      </div>

      {outside.length > 0 ? (
        <div className="space-y-1 border-b border-[var(--border)] px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            {props.outsideHoursLabel}
          </p>
          {outside.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={(e) => props.onOpenEvent(ev.id, e.currentTarget)}
              className={cn(
                "block w-full rounded-[var(--radius)] border px-2 py-1.5 text-left text-xs",
                eventBlockClass(props.isOverdue(ev.scheduledAt)),
              )}
            >
              <span className="tabular text-[var(--muted-foreground)]">
                {timeLabel(ev.scheduledAt, props.dateLocale)}
              </span>
              <span className="ml-2 font-medium">{ev.title}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="max-h-[min(70vh,42rem)] overflow-y-auto">
        <div className="grid grid-cols-[3.5rem_1fr]">
          <div
            className="relative border-r border-[var(--border)]"
            style={{ height: gridHeight }}
            aria-hidden
          >
            {hours.map((h, i) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-xs tabular text-[var(--muted-foreground)]"
                style={{ top: i * DAY_PX_PER_HOUR }}
              >
                {formatHhMm(h)}
              </div>
            ))}
          </div>

          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((h, i) => (
              <button
                key={h}
                type="button"
                aria-label={`${formatHhMm(h)}`}
                className="absolute inset-x-0 border-b border-[var(--border)]/70 hover:bg-[var(--muted)]/30"
                style={{
                  top: i * DAY_PX_PER_HOUR,
                  height: DAY_PX_PER_HOUR,
                }}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("[data-event]")) return;
                  props.onOpenSlot(props.anchor, e.currentTarget, formatHhMm(h));
                }}
              />
            ))}

            {timed.map((ev) => {
              const startMin = minutesFromMidnight(parseLocal(ev.scheduledAt));
              const top =
                ((startMin - rangeStartMin) / 60) * DAY_PX_PER_HOUR;
              const height = Math.max(
                (EVENT_VISUAL_MINUTES / 60) * DAY_PX_PER_HOUR,
                28,
              );
              return (
                <button
                  key={ev.id}
                  type="button"
                  data-event
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onOpenEvent(ev.id, e.currentTarget);
                  }}
                  className={cn(
                    "absolute left-1 right-2 z-[1] overflow-hidden rounded-[var(--radius)] border px-2 py-1 text-left text-xs shadow-sm",
                    eventBlockClass(props.isOverdue(ev.scheduledAt)),
                  )}
                  style={{ top, height }}
                  title={ev.title}
                >
                  <span className="block truncate font-medium">{ev.title}</span>
                  <span className="block truncate tabular text-[10px] opacity-80">
                    {timeLabel(ev.scheduledAt, props.dateLocale)} · {ev.storeName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
