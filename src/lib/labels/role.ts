import type { Role } from "@prisma/client";
import { t, type Locale } from "@/i18n";

/** Etichetta UI IT/EN per `Role` (membership / audit). */
export function roleLabel(
  role: Role | string,
  locale: Locale = "it",
): string {
  const map = t(locale).roles as Record<string, string>;
  return map[role] ?? role;
}
