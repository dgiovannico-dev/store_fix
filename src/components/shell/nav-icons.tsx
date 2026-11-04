"use client";

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
import type { NavIconName } from "./nav-config";

const ICONS: Record<NavIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  ticket: Ticket,
  store: MapPin,
  vendors: Users,
  assets: ClipboardList,
  contracts: FileText,
  calendar: CalendarDays,
  rfq: Gavel,
  settings: Settings2,
  segnala: Home,
  newTicket: PlusCircle,
  inbox: Inbox,
};

export function NavIcon({
  name,
  className,
}: {
  name: NavIconName;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Ticket;
  return <Icon className={className} aria-hidden />;
}
