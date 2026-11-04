"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  cancelPmEventAction,
  completePmEventAction,
  createPmEventAction,
} from "@/app/actions/pm-events";
import { CalendarAnchorDialog } from "@/components/calendar/calendar-anchor-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RowActionLink, RowActionSubmit } from "@/components/ui/row-actions";
import { StatusPanel } from "@/components/ui/status-panel";
import {
  rectFromDom,
  type AnchorRect,
} from "@/lib/calendar/anchor-position";
import {
  addDays,
  addMonths,
  buildMonthGrid,
  buildWeekDays,
  endOfWeekSunday,
  formatHhMm,
  hoursInRange,
  minutesFromMidnight,
  sameYmd,
  startOfWeekMonday,
  toYmd,
} from "@/lib/calendar/grid";
import { controlClass } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n";

export type PmCalendarEvent = {
  id: string;
  title: string;
  scheduledAt: string;
  storeId: string;
  storeName: string;
  vendorName: string | null;
  assetLabel: string | null;
};

export type PmCalendarOption = { id: string; name: string };

export type PmCalendarCopy = {
  title: string;
  hint: string;
  add: string;
  empty: string;
  titlePlaceholder: string;
  storePlaceholder: string;
  vendorPlaceholder: string;
  dateLabel: string;
  timeLabel: string;
  recurrenceLabel: string;
  recurrenceNone: string;
  recurrenceWeekly: string;
  recurrenceMonthly: string;
  recurrenceQuarterly: string;
  schedule: string;
  overdue: string;
  openTicket: string;
  done: string;
  cancel: string;
  today: string;
  viewDay: string;
  viewWeek: string;
  viewMonth: string;
  outsideHours: string;
  more: string;
  createTitle: string;
  detailTitle: string;
  close: string;
  weekdays: readonly string[];
};

/** GCal order: Day → Week → Month */
type ViewMode = "day" | "week" | "month";

type Panel =
  | { kind: "create"; dateYmd: string; timeHHmm: string; anchor: AnchorRect }
  | { kind: "event"; eventId: string; anchor: AnchorRect }
  | null;

const DAY_HOUR_START = 6;
const DAY_HOUR_END = 21;
const DAY_PX_PER_HOUR = 56;
const EVENT_VISUAL_MINUTES = 45;

function parseLocal(iso: string): Date {
  return new Date(iso);
}

function timeLabel(iso: string, locale: string): string {
  return parseLocal(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function monthTitle(anchor: Date, locale: string): string {
  return anchor.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}

function weekTitle(anchor: Date, locale: string): string {
  const start = startOfWeekMonday(anchor);
  const end = endOfWeekSunday(anchor);
  const a = start.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
  const b = end.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${a} – ${b}`;
}

function eventBlockClass(overdue: boolean): string {
  return overdue
    ? "border-[color-mix(in_oklab,var(--critical)_35%,var(--border))] bg-[color-mix(in_oklab,var(--critical)_12%,transparent)] text-[var(--critical)]"
    : "border-[color-mix(in_oklab,var(--primary)_28%,var(--border))] bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]";
}

export function PmCalendar(props: {
  events: PmCalendarEvent[];
  stores: PmCalendarOption[];
  vendors: PmCalendarOption[];
  copy: PmCalendarCopy;
  locale: Locale;
  dateLocale: string;
}) {
  const { copy } = props;
  const [anchor, setAnchor] = useState(() => new Date());
  // HQ default month; phone switches to day on first mount (F5-UX-14)
  const [view, setView] = useState<ViewMode>("month");
  const [panel, setPanel] = useState<Panel>(null);
  const [today] = useState(() => new Date());
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) {
      setView("day");
    }
  }, []);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, PmCalendarEvent[]>();
    for (const e of props.events) {
      const key = toYmd(parseLocal(e.scheduledAt));
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          parseLocal(a.scheduledAt).getTime() -
          parseLocal(b.scheduledAt).getTime(),
      );
    }
    return map;
  }, [props.events]);

  const selectedEvent =
    panel?.kind === "event"
      ? (props.events.find((e) => e.id === panel.eventId) ?? null)
      : null;

  const title =
    view === "day"
      ? anchor.toLocaleDateString(props.dateLocale, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : view === "week"
        ? weekTitle(anchor, props.dateLocale)
        : monthTitle(anchor, props.dateLocale);

  function goToday() {
    setAnchor(new Date());
  }

  function goPrev() {
    setAnchor((d) => {
      if (view === "day") return addDays(d, -1);
      if (view === "week") return addDays(d, -7);
      return addMonths(d, -1);
    });
  }

  function goNext() {
    setAnchor((d) => {
      if (view === "day") return addDays(d, 1);
      if (view === "week") return addDays(d, 7);
      return addMonths(d, 1);
    });
  }

  function openCreate(day: Date, el: HTMLElement, timeHHmm = "09:00") {
    setCreateError(null);
    setPanel({
      kind: "create",
      dateYmd: toYmd(day),
      timeHHmm,
      anchor: rectFromDom(el.getBoundingClientRect()),
    });
  }

  function openEvent(id: string, el: HTMLElement) {
    setPanel({
      kind: "event",
      eventId: id,
      anchor: rectFromDom(el.getBoundingClientRect()),
    });
  }

  function isOverdue(iso: string): boolean {
    return parseLocal(iso).getTime() < today.getTime();
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-4">
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {copy.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {copy.hint}
          </p>
        </div>
        <Button
          type="button"
          onClick={(e) => openCreate(anchor, e.currentTarget)}
          className="gap-1.5"
          disabled={props.stores.length === 0}
        >
          <Plus className="size-4" aria-hidden />
          {copy.add}
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-3">
        <Button type="button" variant="outline" size="sm" onClick={goToday}>
          {copy.today}
        </Button>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Precedente"
            onClick={goPrev}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Successivo"
            onClick={goNext}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <p className="min-w-[10rem] font-[family-name:var(--font-sora)] text-lg font-semibold capitalize text-[var(--foreground)]">
          {title}
        </p>
        <div
          className="ml-auto flex rounded-[var(--radius)] border border-[var(--border)] p-0.5"
          role="tablist"
          aria-label="Vista calendario"
        >
          {(
            [
              ["day", copy.viewDay],
              ["week", copy.viewWeek],
              ["month", copy.viewMonth],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              className={cn(
                "rounded-[calc(var(--radius)-2px)] px-3 py-1.5 text-sm",
                view === id
                  ? "bg-[var(--primary)] font-medium text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
              )}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "day" ? (
        <DayView
          anchor={anchor}
          today={today}
          eventsByDay={eventsByDay}
          dateLocale={props.dateLocale}
          outsideHoursLabel={copy.outsideHours}
          isOverdue={isOverdue}
          onOpenSlot={openCreate}
          onOpenEvent={openEvent}
        />
      ) : null}

      {view === "week" ? (
        <WeekView
          anchor={anchor}
          today={today}
          eventsByDay={eventsByDay}
          weekdays={copy.weekdays}
          dateLocale={props.dateLocale}
          isOverdue={isOverdue}
          onOpenDay={openCreate}
          onOpenEvent={openEvent}
        />
      ) : null}

      {view === "month" ? (
        <MonthView
          anchor={anchor}
          today={today}
          eventsByDay={eventsByDay}
          weekdays={copy.weekdays}
          moreLabel={copy.more}
          dateLocale={props.dateLocale}
          isOverdue={isOverdue}
          onOpenDay={openCreate}
          onOpenEvent={openEvent}
        />
      ) : null}

      <CalendarAnchorDialog
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
        anchor={panel?.anchor ?? null}
        title={
          panel?.kind === "event" ? copy.detailTitle : copy.createTitle
        }
        closeLabel={copy.close}
      >
        {panel?.kind === "create" ? (
          props.stores.length === 0 ? (
            <StatusPanel
              kind="empty"
              title={copy.empty}
              locale={props.locale}
            />
          ) : (
            <form
              action={async (fd) => {
                setCreatePending(true);
                setCreateError(null);
                const result = await createPmEventAction({}, fd);
                setCreatePending(false);
                if (result.error) {
                  setCreateError(result.error);
                  return;
                }
                setPanel(null);
              }}
              className="space-y-3"
            >
              <Input
                name="title"
                required
                minLength={2}
                placeholder={copy.titlePlaceholder}
                autoFocus
              />
              <select
                name="storeId"
                required
                className={controlClass}
                defaultValue=""
              >
                <option value="" disabled>
                  {copy.storePlaceholder}
                </option>
                {props.stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select name="vendorId" className={controlClass} defaultValue="">
                <option value="">{copy.vendorPlaceholder}</option>
                {props.vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <div className="grid gap-3 grid-cols-2">
                <label className="text-sm">
                  {copy.dateLabel}
                  <input
                    name="scheduledDate"
                    type="date"
                    required
                    defaultValue={panel.dateYmd}
                    className={`mt-1 ${controlClass}`}
                  />
                </label>
                <label className="text-sm">
                  {copy.timeLabel}
                  <input
                    name="scheduledTime"
                    type="time"
                    defaultValue={panel.timeHHmm}
                    className={`mt-1 ${controlClass}`}
                  />
                </label>
              </div>
              <label className="block text-sm">
                {copy.recurrenceLabel}
                <select
                  name="recurrence"
                  defaultValue="none"
                  className={`mt-1 ${controlClass}`}
                >
                  <option value="none">{copy.recurrenceNone}</option>
                  <option value="weekly">{copy.recurrenceWeekly}</option>
                  <option value="monthly">{copy.recurrenceMonthly}</option>
                  <option value="quarterly">{copy.recurrenceQuarterly}</option>
                </select>
              </label>
              {createError ? (
                <p className="text-sm text-[var(--critical)]">{createError}</p>
              ) : null}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPanel(null)}
                >
                  {copy.cancel}
                </Button>
                <Button type="submit" disabled={createPending}>
                  {copy.schedule}
                </Button>
              </div>
            </form>
          )
        ) : null}

        {panel?.kind === "event" && selectedEvent ? (
          <div className="space-y-3">
            <div>
              <p className="font-[family-name:var(--font-sora)] text-base font-semibold">
                {selectedEvent.title}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {selectedEvent.storeName}
                {selectedEvent.vendorName
                  ? ` · ${selectedEvent.vendorName}`
                  : ""}
                {selectedEvent.assetLabel
                  ? ` · ${selectedEvent.assetLabel}`
                  : ""}
              </p>
              <p
                className={cn(
                  "mt-2 text-sm",
                  isOverdue(selectedEvent.scheduledAt)
                    ? "text-[var(--critical)]"
                    : "text-[var(--muted-foreground)]",
                )}
              >
                {parseLocal(selectedEvent.scheduledAt).toLocaleString(
                  props.dateLocale,
                )}
                {isOverdue(selectedEvent.scheduledAt)
                  ? ` · ${copy.overdue}`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
              <RowActionLink
                href={`/app/tickets/new?storeId=${encodeURIComponent(selectedEvent.storeId)}`}
                label={copy.openTicket}
                variant="openTicket"
              />
              <form
                action={async () => {
                  await completePmEventAction(selectedEvent.id);
                  setPanel(null);
                }}
              >
                <RowActionSubmit label={copy.done} variant="done" />
              </form>
              <form
                action={async () => {
                  await cancelPmEventAction(selectedEvent.id);
                  setPanel(null);
                }}
              >
                <RowActionSubmit label={copy.cancel} variant="cancel" />
              </form>
            </div>
          </div>
        ) : null}
      </CalendarAnchorDialog>
    </div>
  );
}

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

function MonthView(props: {
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

/** Timed day grid 06:00–21:00; events as absolute blocks (~45m visual). */
function DayView(props: {
  anchor: Date;
  today: Date;
  eventsByDay: Map<string, PmCalendarEvent[]>;
  dateLocale: string;
  outsideHoursLabel: string;
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
          {isToday ? " · oggi" : ""}
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

function WeekView(props: {
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
