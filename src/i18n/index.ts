import { en } from "./en";
import { it, type MessageCatalog } from "./it";

export type Locale = "it" | "en";

const catalogs: Record<Locale, MessageCatalog> = { it, en };

/** Default locale MVP: italiano. */
export function t(locale: Locale = "it"): MessageCatalog {
  return catalogs[locale] ?? it;
}

export { it, en };
export type { MessageCatalog };
