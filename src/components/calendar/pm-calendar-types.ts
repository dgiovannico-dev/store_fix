import type { Locale, MessageCatalog } from "@/i18n";

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

/** Keep in sync with MessageCatalog.pm (IT/EN). */
export type PmCalendarCopy = MessageCatalog["pm"];

export type ViewMode = "day" | "week" | "month";

export type { Locale };
