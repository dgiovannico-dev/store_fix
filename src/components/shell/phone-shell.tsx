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
import type { NavItem } from "./nav-config";
import { NavIcon } from "./nav-icons";

export function PhoneShell(props: {
  brand: string;
  items: NavItem[];
  topRight: ReactNode;
  children: ReactNode;
  signOutLabel: string;
  breadcrumbLabels: BreadcrumbLabels;
  homeHref: string;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link
            href={props.items[0]?.href ?? "/"}
            className="font-[family-name:var(--font-sora)] text-base font-semibold text-[var(--primary)]"
          >
            {props.brand}
          </Link>
          <div className="ml-auto flex items-center gap-2">
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
