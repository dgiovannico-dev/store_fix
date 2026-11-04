"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import {
  AppBreadcrumbs,
  type BreadcrumbLabels,
} from "@/components/layout/app-breadcrumbs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ProductTourHost,
  startProductTour,
} from "@/features/product-tour/tour-controller";
import type { NavItem } from "./nav-config";
import { NavIcon } from "./nav-icons";

function tourAttrForHref(href: string): string | undefined {
  if (href.includes("/tickets/new")) return "nav.newTicket";
  if (href.includes("/tickets")) return "nav.tickets";
  if (href.includes("/segnala")) return "nav.segnala";
  if (href.includes("/settings")) return "nav.locale";
  if (href.includes("/inbox")) return "nav.inbox";
  if (href.includes("/rfq")) return "nav.rfq";
  return undefined;
}

export function PhoneShell(props: {
  brand: string;
  items: NavItem[];
  topRight: ReactNode;
  children: ReactNode;
  signOutLabel: string;
  breadcrumbLabels: BreadcrumbLabels;
  homeHref: string;
  audience?: "store" | "vendor";
}) {
  const pathname = usePathname();
  const audience = props.audience ?? "store";

  return (
    <div
      className="flex min-h-dvh flex-col bg-[var(--background)]"
      data-tour="shell.phone"
    >
      <ProductTourHost audience={audience} softPrompt />
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link
            href={props.items[0]?.href ?? "/"}
            className="font-[family-name:var(--font-sora)] text-base font-semibold text-[var(--primary)]"
          >
            {props.brand}
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="rounded-[var(--radius)] px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              data-tour="help.tour"
              onClick={() => startProductTour(audience, "full")}
            >
              Aiuto
            </button>
            {props.topRight}
            <form action="/logout" method="post">
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label={props.signOutLabel}
                className="size-10 text-[var(--muted-foreground)]"
              >
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </div>
        <div className="border-t border-[var(--border)] px-4 py-2">
          <AppBreadcrumbs
            labels={props.breadcrumbLabels}
            homeHref={props.homeHref}
          />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[430px] flex-1 pb-24">
        {props.children}
      </div>

      <nav
        aria-label="Menu principale"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--card)] pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto flex max-w-[430px] items-stretch justify-around px-1 py-1">
          {props.items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const emphasize = item.href.includes("/new");
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  data-tour={tourAttrForHref(item.href)}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[var(--radius)] px-1 py-1.5 text-[10px] font-medium",
                    active
                      ? "text-[var(--primary)]"
                      : "text-[var(--muted-foreground)]",
                    emphasize &&
                      "text-[var(--primary)] [&_svg]:size-6 [&_svg]:stroke-[2.25]",
                  )}
                >
                  <NavIcon name={item.icon} className="size-5" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
