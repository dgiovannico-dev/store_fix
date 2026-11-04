"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { ReactNode } from "react";
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
import type { NavItem } from "./nav-config";

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SidebarNav({
  items,
  brand,
  onNavigate,
}: {
  items: NavItem[];
  brand: string;
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
    </div>
  );
}

export function HqShell(props: {
  brand: string;
  items: NavItem[];
  topRight: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-[var(--background)]">
      <aside className="sticky top-0 hidden h-dvh w-[var(--sidebar-width)] shrink-0 border-r border-[var(--border)] bg-[var(--card)] lg:block">
        <SidebarNav items={props.items} brand={props.brand} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--card)]/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/80 sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="Menu"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>{props.brand}</SheetTitle>
              </SheetHeader>
              <SidebarNav items={props.items} brand={props.brand} />
            </SheetContent>
          </Sheet>
          <div className="font-[family-name:var(--font-sora)] text-sm font-semibold text-[var(--primary)] lg:hidden">
            {props.brand}
          </div>
          <div className="ml-auto flex items-center gap-2">{props.topRight}</div>
        </header>
        <div className="flex-1">{props.children}</div>
      </div>
    </div>
  );
}
