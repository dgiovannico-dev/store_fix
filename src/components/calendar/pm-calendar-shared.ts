import {
  endOfWeekSunday,
  startOfWeekMonday,
} from "@/lib/calendar/grid";

export const DAY_HOUR_START = 6;
export const DAY_HOUR_END = 21;
export const DAY_PX_PER_HOUR = 56;
export const EVENT_VISUAL_MINUTES = 45;

export function parseLocal(iso: string): Date {
  return new Date(iso);
}

export function timeLabel(iso: string, locale: string): string {
  return parseLocal(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function monthTitle(anchor: Date, locale: string): string {
  return anchor.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}

export function weekTitle(anchor: Date, locale: string): string {
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

export function eventBlockClass(overdue: boolean): string {
  return overdue
    ? "border-[color-mix(in_oklab,var(--critical)_35%,var(--border))] bg-[color-mix(in_oklab,var(--critical)_12%,transparent)] text-[var(--critical)]"
    : "border-[color-mix(in_oklab,var(--primary)_28%,var(--border))] bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]";
}
