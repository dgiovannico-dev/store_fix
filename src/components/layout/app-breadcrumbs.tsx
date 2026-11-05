"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbLabels = {
  home: string;
  breadcrumb: string;
  detail: string;
  newItem: string;
  importCsv: string;
  scorecard: string;
  members: string;
  audit: string;
  locale: string;
  routes: Record<string, string>;
};

type Crumb = { href?: string; label: string };

function buildCrumbs(
  pathname: string,
  labels: BreadcrumbLabels,
  homeHref: string,
): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return [{ label: labels.home }];

  const crumbs: Crumb[] = [{ href: homeHref, label: labels.home }];

  // Skip first segment group: app | vendor
  let i = 0;
  if (parts[0] === "app" || parts[0] === "vendor" || parts[0] === "onboarding") {
    i = 1;
  }

  let acc = parts[0] === "app" || parts[0] === "vendor" ? `/${parts[0]}` : "";
  if (parts[0] === "onboarding") {
    return [
      {
        href: "/onboarding",
        label: labels.routes.onboarding ?? labels.home,
      },
    ];
  }

  for (; i < parts.length; i++) {
    const seg = parts[i]!;
    acc += `/${seg}`;
    const next = parts[i + 1];
    const isId =
      /^[0-9a-f-]{8,}$/i.test(seg) ||
      (seg.length > 12 && !labels.routes[seg]);

    if (isId) {
      crumbs.push({
        href: i === parts.length - 1 ? undefined : acc,
        label: labels.detail,
      });
      continue;
    }

    if (seg === "new") {
      crumbs.push({ label: labels.newItem });
      continue;
    }
    if (seg === "import") {
      crumbs.push({ label: labels.importCsv });
      continue;
    }
    if (seg === "scorecard") {
      crumbs.push({ label: labels.scorecard });
      continue;
    }
    if (seg === "members") {
      crumbs.push({ label: labels.members });
      continue;
    }
    if (seg === "audit") {
      crumbs.push({ label: labels.audit });
      continue;
    }
    if (seg === "locale") {
      crumbs.push({ label: labels.locale });
      continue;
    }

    const label = labels.routes[seg] ?? seg;
    const isLast = i === parts.length - 1 && !next;
    crumbs.push({
      href: isLast ? undefined : acc,
      label,
    });
  }

  // Deduplicate consecutive same labels / collapse home-only
  return crumbs.filter((c, idx) => {
    if (idx === 0) return true;
    return c.label !== crumbs[idx - 1]?.label || c.href !== crumbs[idx - 1]?.href;
  });
}

export function AppBreadcrumbs(props: {
  labels: BreadcrumbLabels;
  homeHref: string;
  className?: string;
}) {
  const pathname = usePathname() || "/";
  /** Avoid SSR/client pathname mismatch (Next soft-nav / searchParams). */
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  const navClass = cn(
    "flex items-center gap-1.5 text-[length:var(--text-caption)] text-[var(--muted-foreground)]",
    props.className,
  );

  if (!ready) {
    return (
      <nav aria-label={props.labels.breadcrumb} className={navClass}>
        <Home
          className="size-3.5 shrink-0 text-[var(--nav-icon)]"
          aria-hidden
        />
        <span className="font-medium text-[var(--foreground)]">
          {props.labels.home}
        </span>
      </nav>
    );
  }

  const crumbs = buildCrumbs(pathname, props.labels, props.homeHref);

  if (crumbs.length <= 1) {
    return (
      <nav aria-label={props.labels.breadcrumb} className={navClass}>
        <Home
          className="size-3.5 shrink-0 text-[var(--nav-icon)]"
          aria-hidden
        />
        <span className="font-medium text-[var(--foreground)]">
          {crumbs[0]?.label ?? props.labels.home}
        </span>
      </nav>
    );
  }

  return (
    <nav
      aria-label={props.labels.breadcrumb}
      className={cn(
        "flex flex-wrap items-center gap-1 text-[length:var(--text-caption)] text-[var(--muted-foreground)]",
        props.className,
      )}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((c, idx) => {
          const last = idx === crumbs.length - 1;
          return (
            <li key={`${c.label}-${idx}`} className="flex items-center gap-1">
              {idx > 0 ? (
                <ChevronRight
                  className="size-3.5 shrink-0 text-[var(--nav-icon)] opacity-70"
                  aria-hidden
                />
              ) : (
                <Home
                  className="size-3.5 shrink-0 text-[var(--nav-icon)]"
                  aria-hidden
                />
              )}
              {c.href && !last ? (
                <Link
                  href={c.href}
                  className="truncate hover:text-[var(--foreground)] hover:underline"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "truncate",
                    last && "font-medium text-[var(--foreground)]",
                  )}
                  aria-current={last ? "page" : undefined}
                >
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
