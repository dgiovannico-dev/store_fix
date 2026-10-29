import { en } from "./en";
import { it, type MessageCatalog } from "./it";

export type Locale = "it" | "en";

const catalogs: Record<Locale, MessageCatalog> = { it, en };

export function isLocale(value: string): value is Locale {
  return value === "it" || value === "en";
}

/** Default locale MVP: italiano. */
export function t(locale: Locale = "it"): MessageCatalog {
  return catalogs[locale] ?? it;
}

export function dateLocaleFor(locale: Locale): string {
  return locale === "en" ? "en-GB" : "it-IT";
}

export { it, en };
export type { MessageCatalog };
export {
  formatMoney,
  formatDateTime,
  withCurrency,
  type FormatPrefs,
} from "./format";
