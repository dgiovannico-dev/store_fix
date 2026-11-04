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

export type ViewMode = "day" | "week" | "month";

export type { Locale };
