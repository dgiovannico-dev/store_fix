export type FormatPrefs = {
  dateLocale: string;
  currency: string;
};

export function formatMoney(
  value: { toString(): string } | number | null | undefined,
  prefs: FormatPrefs = { dateLocale: "it-IT", currency: "EUR" },
): string | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value.toString());
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat(prefs.dateLocale, {
    style: "currency",
    currency: prefs.currency,
  }).format(n);
}

export function formatDateTime(
  value: Date | string | null | undefined,
  prefs: FormatPrefs = { dateLocale: "it-IT", currency: "EUR" },
): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(prefs.dateLocale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}
