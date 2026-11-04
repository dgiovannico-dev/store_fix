import { Role } from "@prisma/client";
import { canMutate } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { t, type Locale } from "@/i18n";

export type ShellAudience = "hq" | "store" | "vendor";

/** Serializable icon keys — resolve Lucide components only in client shells. */
export type NavIconName =
  | "dashboard"
  | "ticket"
  | "store"
  | "vendors"
  | "assets"
  | "contracts"
  | "calendar"
  | "rfq"
  | "settings"
  | "segnala"
  | "newTicket"
  | "inbox";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
};

export function shellAudienceForRole(
  role: Role | undefined | null,
): ShellAudience {
  if (role === Role.vendor) return "vendor";
  if (role === Role.store_manager || role === Role.store_staff) return "store";
  return "hq";
}

export function navHomeForAudience(audience: ShellAudience): string {
  if (audience === "vendor") return "/vendor/inbox";
  if (audience === "store") return "/app/tickets";
  return "/app/dashboard";
}

/** Sidebar HQ (desktop) — IA §4.1 adapted to existing routes. */
export function hqSidebarItems(
  role: Role | undefined | null,
  locale: Locale = "it",
): NavItem[] {
  const msg = t(locale);
  if (role === Role.viewer_finance) {
    return [
      { href: "/app/dashboard", label: msg.nav.dashboard, icon: "dashboard" },
      { href: "/app/tickets", label: msg.nav.tickets, icon: "ticket" },
      { href: "/app/contratti", label: msg.nav.contracts, icon: "contracts" },
    ];
  }
  const items: NavItem[] = [
    { href: "/app/dashboard", label: msg.nav.dashboard, icon: "dashboard" },
    { href: "/app/tickets", label: msg.nav.tickets, icon: "ticket" },
    { href: "/app/stores", label: msg.nav.stores, icon: "store" },
    { href: "/app/vendors", label: msg.nav.vendors, icon: "vendors" },
    { href: "/app/assets", label: msg.nav.assets, icon: "assets" },
    { href: "/app/contratti", label: msg.nav.contracts, icon: "contracts" },
    { href: "/app/calendario", label: msg.nav.calendar, icon: "calendar" },
    { href: "/app/finance/chargeback", label: msg.nav.costs, icon: "contracts" },
    { href: "/app/wallboard", label: msg.nav.overview, icon: "dashboard" },
  ];
  if (role && canMutate(role, RbacAction.manageRfq)) {
    items.push({ href: "/app/rfq", label: msg.nav.rfq, icon: "rfq" });
  }
  if (role && canMutate(role, RbacAction.manageTenant)) {
    items.push({
      href: "/app/settings/locale",
      label: msg.nav.locale,
      icon: "settings",
    });
    items.push({
      href: "/app/settings/ai",
      label: msg.nav.ai,
      icon: "settings",
    });
  }
  return items;
}

/** Bottom nav store — max 4. */
export function storeBottomItems(locale: Locale = "it"): NavItem[] {
  const msg = t(locale);
  return [
    { href: "/app/tickets", label: msg.nav.tickets, icon: "ticket" },
    { href: "/app/segnala", label: msg.nav.segnala, icon: "segnala" },
    {
      href: "/app/tickets/new",
      label: msg.dashboard.ctaTicket,
      icon: "newTicket",
    },
    { href: "/app/settings/locale", label: msg.nav.locale, icon: "settings" },
  ];
}

/** Bottom nav vendor — max 4. */
export function vendorBottomItems(locale: Locale = "it"): NavItem[] {
  const msg = t(locale);
  return [
    { href: "/vendor/inbox", label: msg.nav.inbox, icon: "inbox" },
    { href: "/vendor/rfq", label: msg.nav.rfq, icon: "rfq" },
  ];
}

/** @deprecated use audience helpers — kept for tests/compat */
export function navLinksForRole(
  role: Role | undefined | null,
  locale: Locale = "it",
): { home: string; links: { href: string; label: string }[] } {
  const audience = shellAudienceForRole(role);
  const home = navHomeForAudience(audience);
  const items =
    audience === "vendor"
      ? vendorBottomItems(locale)
      : audience === "store"
        ? storeBottomItems(locale)
        : hqSidebarItems(role, locale);
  return {
    home,
    links: items.map(({ href, label }) => ({ href, label })),
  };
}
