"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import type { ReactNode } from "react";
import {
  AppBreadcrumbs,
  type BreadcrumbLabels,
} from "@/components/layout/app-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  ProductTourHost,
  TourHelpButtons,
} from "@/features/product-tour/tour-controller";
import type { NavItem } from "./nav-config";
import { NavIcon } from "./nav-icons";

function tourAttrForHref(href: string): string | undefined {
  if (href.includes("/dashboard")) return "nav.dashboard";
  if (href.includes("/tickets")) return "nav.tickets";
  if (href.includes("/stores")) return "nav.stores";
  if (href.includes("/vendors")) return "nav.vendors";
  if (href.includes("/assets")) return "nav.assets";
  if (href.includes("/contratti")) return "nav.contracts";
  if (href.includes("/calendario")) return "nav.calendar";
  if (href.includes("/rfq")) return "nav.rfq";
  if (href.includes("/settings")) return "nav.locale";
  if (href.includes("/segnala")) return "nav.segnala";
  if (href.includes("/inbox")) return "nav.inbox";
  return undefined;
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const tour = tourAttrForHref(item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      data-tour={tour}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
      )}
    >
      <NavIcon name={item.icon} className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SidebarNav({
  items,
  brand,
  signOutLabel,
  onNavigate,
}: {
  items: NavItem[];
  brand: string;
  signOutLabel: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-4">
        <Link
          href={items[0]?.href ?? "/app/dashboard"}
          onClick={onNavigate}
          className="font-[family-name:var(--font-sora)] text-lg font-semibold tracking-tight text-[var(--primary)]"
        >
          {brand}
        </Link>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            }
            onNavigate={onNavigate}
          />
        ))}
      </nav>
      <TourHelpButtons
        audience="hq"
        label="Tutorial interattivo"
        pageLabel="Spiega questa pagina"
      />
      <div className="border-t border-[var(--border)] p-2">
        <form action="/logout" method="post">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-[var(--muted-foreground)]"
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            {signOutLabel}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function HqShell(props: {
  brand: string;
  items: NavItem[];
  topRight: ReactNode;
  children: ReactNode;
  signOutLabel: string;
  breadcrumbLabels: BreadcrumbLabels;
  homeHref: string;
}) {
  return (
    <div className="flex min-h-dvh bg-[var(--background)]" data-tour="shell.hq">
      <ProductTourHost audience="hq" softPrompt />
      <aside className="sticky top-0 hidden h-dvh w-[var(--sidebar-width)] shrink-0 border-r border-[var(--border)] bg-[var(--card)] lg:block">
        <SidebarNav
          items={props.items}
          brand={props.brand}
          signOutLabel={props.signOutLabel}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--card)]/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/80 sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="Apri menu"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>{props.brand}</SheetTitle>
              </SheetHeader>
              <SidebarNav
                items={props.items}
                brand={props.brand}
                signOutLabel={props.signOutLabel}
              />
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <div className="font-[family-name:var(--font-sora)] text-sm font-semibold text-[var(--primary)] lg:hidden">
              {props.brand}
            </div>
            <AppBreadcrumbs
              labels={props.breadcrumbLabels}
              homeHref={props.homeHref}
              className="hidden lg:flex"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">{props.topRight}</div>
        </header>
        <div className="border-b border-[var(--border)] px-4 py-2 lg:hidden sm:px-6">
          <AppBreadcrumbs
            labels={props.breadcrumbLabels}
            homeHref={props.homeHref}
          />
        </div>
        <div className="flex-1">{props.children}</div>
      </div>
    </div>
  );
}
