import { Role } from "@prisma/client";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Gavel,
  Home,
  Inbox,
  LayoutDashboard,
  MapPin,
  PlusCircle,
  Settings2,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import { canMutate } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { t, type Locale } from "@/i18n";

export type ShellAudience = "hq" | "store" | "vendor";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
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
      { href: "/app/dashboard", label: msg.nav.dashboard, icon: LayoutDashboard },
      { href: "/app/tickets", label: msg.nav.tickets, icon: Ticket },
      { href: "/app/contratti", label: msg.nav.contracts, icon: FileText },
    ];
  }
  const items: NavItem[] = [
    { href: "/app/dashboard", label: msg.nav.dashboard, icon: LayoutDashboard },
    { href: "/app/tickets", label: msg.nav.tickets, icon: Ticket },
    { href: "/app/stores", label: msg.nav.stores, icon: MapPin },
    { href: "/app/vendors", label: msg.nav.vendors, icon: Users },
    { href: "/app/assets", label: msg.nav.assets, icon: ClipboardList },
    { href: "/app/contratti", label: msg.nav.contracts, icon: FileText },
    { href: "/app/calendario", label: msg.nav.calendar, icon: CalendarDays },
  ];
  if (role && canMutate(role, RbacAction.manageRfq)) {
    items.push({ href: "/app/rfq", label: msg.nav.rfq, icon: Gavel });
  }
  if (role && canMutate(role, RbacAction.manageTenant)) {
    items.push({
      href: "/app/settings/locale",
      label: msg.nav.locale,
      icon: Settings2,
    });
  }
  return items;
}

/** Bottom nav store — max 4. */
export function storeBottomItems(locale: Locale = "it"): NavItem[] {
  const msg = t(locale);
  return [
    { href: "/app/tickets", label: msg.nav.tickets, icon: Ticket },
    { href: "/app/segnala", label: msg.nav.segnala, icon: Home },
    {
      href: "/app/tickets/new",
      label: msg.dashboard.ctaTicket,
      icon: PlusCircle,
    },
    { href: "/app/settings/locale", label: msg.nav.locale, icon: Settings2 },
  ];
}

/** Bottom nav vendor — max 4. */
export function vendorBottomItems(locale: Locale = "it"): NavItem[] {
  const msg = t(locale);
  return [
    { href: "/vendor/inbox", label: msg.nav.inbox, icon: Inbox },
    { href: "/vendor/rfq", label: msg.nav.rfq, icon: Gavel },
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
