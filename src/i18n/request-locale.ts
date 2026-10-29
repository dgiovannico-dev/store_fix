import { cookies, headers } from "next/headers";
import { isLocale, t, type Locale, type MessageCatalog } from "@/i18n";

/** Cookie opzionale (settings / preferenza browser) — default Accept-Language. */
export const LOCALE_COOKIE = "ff_locale";

/** Pure: usato in unit test e requestLocale. */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return "it";
  const first =
    header
      .toLowerCase()
      .split(",")[0]
      ?.trim()
      .split(";")[0]
      ?.trim() ?? "";
  if (first.startsWith("en")) return "en";
  return "it";
}

/** Locale per route pubbliche / auth (no tenant ancora). */
export async function requestLocale(): Promise<Locale> {
  const jar = await cookies();
  const fromCookie = jar.get(LOCALE_COOKIE)?.value;
  if (fromCookie && isLocale(fromCookie)) return fromCookie;
  const h = await headers();
  return localeFromAcceptLanguage(h.get("accept-language"));
}

export async function requestMessages(): Promise<MessageCatalog> {
  return t(await requestLocale());
}
