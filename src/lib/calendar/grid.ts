/** Local-calendar helpers (Monday-first week — retail IT). */

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/** Monday = 0 … Sunday = 6 */
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function startOfWeekMonday(d: Date): Date {
  const day = startOfDay(d);
  return addDays(day, -mondayIndex(day));
}

export function endOfWeekSunday(d: Date): Date {
  const start = startOfWeekMonday(d);
  return new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 6,
    23,
    59,
    59,
    999,
  );
}

export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function sameYmd(a: Date, b: Date): boolean {
  return toYmd(a) === toYmd(b);
}

/** 6 weeks × 7 days covering the month of `anchor`. */
export function buildMonthGrid(anchor: Date): Date[] {
  const first = startOfMonth(anchor);
  const gridStart = startOfWeekMonday(first);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function buildWeekDays(anchor: Date): Date[] {
  const start = startOfWeekMonday(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Inclusive hour range, e.g. hoursInRange(6, 21) → [6…21]. */
export function hoursInRange(
  startHour: number,
  endHourInclusive: number,
): number[] {
  const start = Math.max(0, Math.min(23, Math.floor(startHour)));
  const end = Math.max(start, Math.min(23, Math.floor(endHourInclusive)));
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function minutesFromMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** HH:mm from hour + optional minutes. */
export function formatHhMm(hour: number, minute = 0): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
