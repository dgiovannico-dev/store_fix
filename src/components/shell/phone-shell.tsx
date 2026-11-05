"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { CircleHelp, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import {
  AppBreadcrumbs,
  type BreadcrumbLabels,
} from "@/components/layout/app-breadcrumbs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startProductTour } from "@/features/product-tour/tour-launcher";
import type { ProductTourUiLabels } from "@/features/product-tour/tour-controller";
import type { Locale, MessageCatalog } from "@/i18n";
import type { NavItem } from "./nav-config";
import { NavIcon } from "./nav-icons";

const ProductTourHost = dynamic(
  () =>
    import("@/features/product-tour/tour-controller").then(
      (m) => m.ProductTourHost,
    ),
  { ssr: false },
);

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
  tourLabels: ProductTourUiLabels;
  shellLabels: MessageCatalog["shell"];
  tourHelpAria: string;
  tourLaunchLabel: string;
  locale: Locale;
}) {
  const pathname = usePathname();
  const audience = props.audience ?? "store";

  return (
    <div
      className="flex min-h-dvh flex-col bg-[var(--background)]"
      data-tour="shell.phone"
    >
      <ProductTourHost
        audience={audience}
        softPrompt
        labels={props.tourLabels}
        locale={props.locale}
      />
      <header className="sticky top-0 z-40 border-b border-[var(--chrome-border)] bg-[var(--chrome)]/95 backdrop-blur-md">
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
              className="inline-flex size-10 items-center justify-center rounded-[var(--radius)] text-[var(--nav-icon)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--nav-icon-active)]"
              data-tour="help.tour"
              aria-label={props.tourHelpAria}
              title={props.tourLaunchLabel}
              onClick={() =>
                startProductTour(audience, "full", props.locale)
              }
            >
              <CircleHelp
                className="size-4 stroke-[1.75] text-[var(--nav-icon)]"
                aria-hidden
              />
            </button>
            {props.topRight}
            <form action="/logout" method="post">
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label={props.signOutLabel}
                className="size-10 text-[var(--nav-icon)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--nav-icon-active)]"
              >
                <LogOut className="size-4 stroke-[1.75] text-[var(--nav-icon)]" />
              </Button>
            </form>
          </div>
        </div>
        <div className="border-t border-[var(--sidebar-border)] px-4 py-2">
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
        aria-label={props.shellLabels.mainNav}
        data-tour="shell.phone.nav"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--chrome-border)] bg-[var(--chrome)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
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
                    "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[var(--radius)] px-1 py-1.5 text-[10px] font-medium transition-colors",
                    active
                      ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]"
                      : "text-[var(--nav-icon)] hover:bg-[var(--accent)] hover:text-[var(--nav-icon-active)]",
                    emphasize && !active && "text-[var(--primary)]",
                    emphasize && "[&_svg]:size-6 [&_svg]:stroke-[2.25]",
                  )}
                >
                  <NavIcon
                    name={item.icon}
                    className={cn(
                      "size-5 stroke-[1.75]",
                      active
                        ? "text-[var(--nav-icon-active)]"
                        : emphasize
                          ? "text-[var(--primary)]"
                          : "text-[var(--nav-icon)]",
                    )}
                  />
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
