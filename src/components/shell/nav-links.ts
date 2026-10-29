import { Role } from "@prisma/client";
import { t, type Locale } from "@/i18n";

export type NavLink = { href: string; label: string };

/** Link chrome per ruolo (retro S4 — config unica). */
export function navLinksForRole(
  role: Role | undefined | null,
  locale: Locale = "it",
): { home: string; links: NavLink[] } {
  const msg = t(locale);
  if (role === Role.vendor) {
    return {
      home: "/vendor/inbox",
      links: [{ href: "/vendor/inbox", label: msg.nav.inbox }],
    };
  }
  if (role === Role.viewer_finance) {
    return {
      home: "/app/dashboard",
      links: [
        { href: "/app/dashboard", label: msg.nav.dashboard },
        { href: "/app/tickets", label: msg.nav.tickets },
        { href: "/app/contratti", label: msg.nav.contracts },
      ],
    };
  }
  return {
    home: "/app/dashboard",
    links: [
      { href: "/app/dashboard", label: msg.nav.dashboard },
      { href: "/app/tickets", label: msg.nav.tickets },
      { href: "/app/stores", label: msg.nav.stores },
      { href: "/app/contratti", label: msg.nav.contracts },
      { href: "/app/calendario", label: msg.nav.calendar },
      { href: "/app/segnala", label: msg.nav.segnala },
    ],
  };
}
