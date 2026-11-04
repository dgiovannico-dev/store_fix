"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  cancelPmEventAction,
  completePmEventAction,
  createPmEventAction,
} from "@/app/actions/pm-events";
import { CalendarAnchorDialog } from "@/components/calendar/calendar-anchor-dialog";
import { DayView } from "@/components/calendar/pm-calendar-day";
import { MonthView } from "@/components/calendar/pm-calendar-month";
import { WeekView } from "@/components/calendar/pm-calendar-week";
import type {
  PmCalendarCopy,
  PmCalendarEvent,
  PmCalendarOption,
  ViewMode,
} from "@/components/calendar/pm-calendar-types";
import {
  parseLocal,
  weekTitle,
  monthTitle,
} from "@/components/calendar/pm-calendar-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RowActionLink, RowActionSubmit } from "@/components/ui/row-actions";
import { StatusPanel } from "@/components/ui/status-panel";
import {
  rectFromDom,
  type AnchorRect,
} from "@/lib/calendar/anchor-position";
import { addDays, addMonths, toYmd } from "@/lib/calendar/grid";
import { controlClass } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n";

export type {
  PmCalendarCopy,
  PmCalendarEvent,
  PmCalendarOption,
} from "@/components/calendar/pm-calendar-types";

type Panel =
  | { kind: "create"; dateYmd: string; timeHHmm: string; anchor: AnchorRect }
  | { kind: "event"; eventId: string; anchor: AnchorRect }
  | null;

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
            aria-label={copy.prevAria}
            onClick={goPrev}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={copy.nextAria}
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
          aria-label={copy.viewSwitcherAria}
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
          todaySuffix={copy.todaySuffix}
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
