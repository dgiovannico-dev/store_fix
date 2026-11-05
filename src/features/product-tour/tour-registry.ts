import type { Locale } from "@/i18n";
import { tourStepCopyFor } from "@/i18n/tour-steps";

export type TourAudience = "hq" | "store" | "vendor";

export type TourSide = "top" | "right" | "bottom" | "left";

type TourStepSkeleton = {
  id: string;
  /** CSS selector (`[data-tour=…]`). Se assente → popover centrato. */
  element?: string;
  /** Naviga qui prima di mostrare lo step (se diverso dalla route attuale). */
  route?: string;
  side?: TourSide;
  align?: "start" | "center" | "end";
};

export type TourStepDef = TourStepSkeleton & {
  title: string;
  description: string;
};

function hydrate(
  skeletons: TourStepSkeleton[],
  locale: Locale,
): TourStepDef[] {
  const copy = tourStepCopyFor(locale);
  return skeletons.map((s) => {
    const c = copy[s.id];
    return {
      ...s,
      title: c?.title ?? s.id,
      description: c?.description ?? "",
    };
  });
}

/** Tutorial completo — struttura ancore; copy da i18n/tour-steps. */
export function stepsForAudience(
  audience: TourAudience,
  locale: Locale = "it",
): TourStepDef[] {
  if (audience === "store") return hydrate(storeSteps(), locale);
  if (audience === "vendor") return hydrate(vendorSteps(), locale);
  return hydrate(hqSteps(), locale);
}

function hqSteps(): TourStepSkeleton[] {
  return [
    {
      id: "hq.welcome",
      element: "[data-tour='shell.hq']",
      side: "right",
    },
    {
      id: "hq.onboarding",
      route: "/onboarding",
      element: "[data-tour='hq.onboarding']",
      side: "bottom",
    },
    {
      id: "hq.dashboard",
      route: "/app/dashboard",
      element: "[data-tour='page.dashboard.root']",
      side: "bottom",
    },
    {
      id: "hq.dashboard.kpi",
      route: "/app/dashboard",
      element: "[data-tour='page.dashboard.kpi']",
      side: "bottom",
    },
    {
      id: "hq.dashboard.byStore",
      route: "/app/dashboard",
      element: "[data-tour='page.dashboard.byStore']",
      side: "top",
    },
    {
      id: "hq.tickets",
      route: "/app/tickets",
      element: "[data-tour='page.tickets.root']",
      side: "bottom",
    },
    {
      id: "hq.tickets.filters",
      route: "/app/tickets",
      element: "[data-tour='page.tickets.filters']",
      side: "bottom",
    },
    {
      id: "hq.tickets.table",
      route: "/app/tickets",
      element: "[data-tour='page.tickets.table']",
      side: "top",
    },
    {
      id: "hq.stores",
      route: "/app/stores",
      element: "[data-tour='page.stores.root']",
      side: "bottom",
    },
    {
      id: "hq.vendors",
      route: "/app/vendors",
      element: "[data-tour='page.vendors.root']",
      side: "bottom",
    },
    {
      id: "hq.assets",
      route: "/app/assets",
      element: "[data-tour='page.assets.root']",
      side: "bottom",
    },
    {
      id: "hq.contracts",
      route: "/app/contratti",
      element: "[data-tour='page.contracts.root']",
      side: "bottom",
    },
    {
      id: "hq.calendar",
      route: "/app/calendario",
      element: "[data-tour='page.calendar.root']",
      side: "bottom",
    },
    // Ordine allineato a `hqSidebarItems` (nav-config): chargeback → wallboard → rfq → locale → ai
    {
      id: "hq.chargeback",
      route: "/app/finance/chargeback",
      element: "[data-tour='page.chargeback.root']",
      side: "bottom",
    },
    {
      id: "hq.wallboard",
      route: "/app/wallboard",
      element: "[data-tour='hq.wallboard']",
      side: "bottom",
    },
    {
      id: "hq.rfq",
      route: "/app/rfq",
      element: "[data-tour='page.rfq.root']",
      side: "bottom",
    },
    {
      id: "hq.settings",
      route: "/app/settings/locale",
      element: "[data-tour='page.settings.locale']",
      side: "bottom",
    },
    {
      id: "hq.ai",
      route: "/app/settings/ai",
      element: "[data-tour='hq.settings.ai']",
      side: "bottom",
    },
    {
      id: "hq.flussoA",
    },
  ];
}

/** Route primarie del tour HQ (prima occorrenza), escluse onboarding/welcome senza nav. */
export function hqTourSidebarRoutes(): string[] {
  const seen = new Set<string>();
  const routes: string[] = [];
  for (const s of hqSteps()) {
    if (!s.route || s.route === "/onboarding") continue;
    if (seen.has(s.route)) continue;
    seen.add(s.route);
    routes.push(s.route);
  }
  return routes;
}

function storeSteps(): TourStepSkeleton[] {
  return [
    {
      id: "store.welcome",
      element: "[data-tour='shell.phone']",
      side: "top",
    },
    {
      id: "store.tickets",
      route: "/app/tickets",
      element: "[data-tour='page.tickets.root']",
      side: "bottom",
    },
    {
      id: "store.segnala",
      route: "/app/segnala",
      element: "[data-tour='page.segnala.root']",
      side: "bottom",
    },
    {
      id: "store.new",
      route: "/app/tickets/new",
      element: "[data-tour='page.tickets.new']",
      side: "bottom",
    },
    {
      id: "store.locale",
      route: "/app/settings/locale",
      element: "[data-tour='page.settings.locale']",
      side: "bottom",
    },
    {
      id: "store.flussoA",
    },
  ];
}

function vendorSteps(): TourStepSkeleton[] {
  return [
    {
      id: "vendor.welcome",
      element: "[data-tour='shell.phone']",
      side: "top",
    },
    {
      id: "vendor.inbox",
      route: "/vendor/inbox",
      element: "[data-tour='page.vendor.inbox']",
      side: "bottom",
    },
    {
      id: "vendor.rfq",
      route: "/vendor/rfq",
      element: "[data-tour='page.vendor.rfq']",
      side: "bottom",
    },
    {
      id: "vendor.flussoA",
    },
  ];
}

/** Capitolo «Spiega questa pagina»: step della route corrente + contesto vicino. */
export function chapterForPath(
  audience: TourAudience,
  pathname: string,
  locale: Locale = "it",
): TourStepDef[] {
  const all = stepsForAudience(audience, locale);
  const onPage = all.filter(
    (s) =>
      s.route &&
      (pathname === s.route || pathname.startsWith(`${s.route}/`)),
  );
  if (onPage.length > 0) return onPage;
  const welcome = all.find((s) => s.id.endsWith(".welcome"));
  return welcome ? [welcome] : all.slice(0, 1);
}
