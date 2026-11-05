"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver, type DriveStep, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "@/features/product-tour/tour.css";
import { startProductTour } from "./tour-launcher";
import type { Locale } from "@/i18n";
import {
  type TourAudience,
  type TourStepDef,
} from "./tour-registry";

const STORAGE_KEY = "ff.tour.resume";
const SOFT_KEY = "ff.tour.softprompt";
/** Detects Next.js server redirects that bounce the tour (e.g. dashboard → onboarding). */
const BOUNCE_KEY = "ff.tour.bounce";

type TourState = {
  audience: TourAudience;
  mode: "full" | "page";
  /** Index into full `defs` list. */
  index: number;
  defs: TourStepDef[];
};

type BounceGuard = {
  target: string;
  index: number;
  from: string;
};


function readState(): TourState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TourState;
  } catch {
    return null;
  }
}

function writeState(state: TourState | null) {
  if (!state) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(BOUNCE_KEY);
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function readBounce(): BounceGuard | null {
  try {
    const raw = window.sessionStorage.getItem(BOUNCE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BounceGuard;
  } catch {
    return null;
  }
}

function writeBounce(guard: BounceGuard | null) {
  if (!guard) {
    window.sessionStorage.removeItem(BOUNCE_KEY);
    return;
  }
  window.sessionStorage.setItem(BOUNCE_KEY, JSON.stringify(guard));
}

/** Skip steps whose route redirected us away (same target never reached). */
function skipBlockedRoute(
  defs: TourStepDef[],
  fromIndex: number,
  blockedRoute: string,
): number {
  let i = fromIndex;
  while (i < defs.length && defs[i]?.route === blockedRoute) {
    i += 1;
  }
  return i;
}

function stepFitsPath(step: TourStepDef, pathname: string): boolean {
  if (!step.route) return true;
  return pathname === step.route || pathname.startsWith(`${step.route}/`);
}

/** Soft-nav target; `tour=1` unlocks gated pages (e.g. dashboard) during the tour. */
function tourHref(route: string): string {
  if (route.includes("?")) {
    return `${route}&tour=1`;
  }
  return `${route}?tour=1`;
}

/** Prefer a painted target (sidebar hidden &lt;lg is in DOM at 0×0). */
function queryVisible(selector: string): Element | null {
  const nodes = document.querySelectorAll(selector);
  for (const el of nodes) {
    const r = el.getBoundingClientRect();
    if (r.width >= 1 && r.height >= 1) return el;
  }
  return null;
}

function toDriveStep(d: TourStepDef): DriveStep {
  const popover = {
    title: d.title,
    description: d.description,
    side: d.side ?? "bottom",
    align: d.align ?? "start",
  };
  if (!d.element) {
    return { popover };
  }
  const visible = queryVisible(d.element);
  if (visible) {
    return { element: visible, popover };
  }
  // Fallback: selector string (Driver waits); skip path uses queryVisible.
  return {
    element: d.element,
    popover,
  };
}

export type ProductTourUiLabels = {
  softPromptConfirm: string;
  next: string;
  prev: string;
  done: string;
};

export function ProductTourHost(props: {
  audience: TourAudience;
  softPrompt?: boolean;
  labels: ProductTourUiLabels;
  locale: Locale;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const active = useRef<Driver | null>(null);
  /** True while we intentionally tear down to change route. */
  const pendingNav = useRef(false);
  /** Keep sessionStorage across an intentional destroy+restart on same path. */
  const keepStateOnDestroy = useRef(false);
  /** Effect cleanup destroy must not wipe resume state (pathname changes). */
  const silenceDestroy = useRef(false);
  const runId = useRef(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "?" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      startProductTour(props.audience, "full", props.locale);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.audience, props.locale]);

  useEffect(() => {
    if (!props.softPrompt) return;
    if (window.localStorage.getItem(SOFT_KEY)) return;
    const id = window.setTimeout(() => {
      const ok = window.confirm(props.labels.softPromptConfirm);
      window.localStorage.setItem(SOFT_KEY, ok ? "started" : "later");
      if (ok) startProductTour(props.audience, "full", props.locale);
    }, 1400);
    return () => window.clearTimeout(id);
  }, [
    props.audience,
    props.softPrompt,
    props.labels.softPromptConfirm,
    props.locale,
  ]);

  useEffect(() => {
    let cancelled = false;
    const myRun = ++runId.current;

    async function waitForSelector(
      selector: string,
      ms = 6000,
    ): Promise<Element | null> {
      const start = Date.now();
      while (Date.now() - start < ms) {
        if (cancelled || myRun !== runId.current) return null;
        const el = queryVisible(selector);
        if (el) return el;
        await new Promise((r) => setTimeout(r, 80));
      }
      return queryVisible(selector);
    }

    function clearTour() {
      writeState(null);
      pendingNav.current = false;
    }

    function destroyQuiet() {
      const d = active.current;
      active.current = null;
      if (!d) return;
      silenceDestroy.current = true;
      try {
        d.destroy();
      } catch {
        /* already torn down */
      } finally {
        silenceDestroy.current = false;
      }
    }

    async function runFromStorage() {
      if (cancelled || myRun !== runId.current) return;
      const loaded = readState();
      if (!loaded) return;
      // Narrow once — nested handlers (handleForward) must see TourState, not null.
      const parsed: TourState = loaded;

      destroyQuiet();
      pendingNav.current = false;

      let index = Math.min(
        Math.max(0, parsed.index),
        Math.max(0, parsed.defs.length - 1),
      );

      // Advance until we find a step that belongs on this path (or needs nav).
      while (index < parsed.defs.length) {
        const candidate = parsed.defs[index]!;
        if (!candidate.route || stepFitsPath(candidate, pathname)) {
          break;
        }

        // Server redirected us away from candidate.route (e.g. /app/dashboard
        // → /onboarding while network onboarding incomplete). Skip that chapter.
        const bounce = readBounce();
        if (bounce && bounce.target === candidate.route && pathname !== candidate.route) {
          const skippedTo = skipBlockedRoute(
            parsed.defs,
            index,
            candidate.route,
          );
          writeBounce(null);
          index = skippedTo;
          writeState({ ...parsed, index });
          continue;
        }

        // Different route → navigate once, then resume.
        pendingNav.current = true;
        writeBounce({
          target: candidate.route,
          index,
          from: pathname,
        });
        writeState({ ...parsed, index });
        router.push(tourHref(candidate.route));
        return;
      }

      if (index >= parsed.defs.length) {
        clearTour();
        return;
      }

      // Skip missing anchors on this path. Always advance past missing steps
      // (even at a route boundary) so progress numbers stay sequential.
      while (index < parsed.defs.length) {
        const step = parsed.defs[index]!;
        if (step.route && !stepFitsPath(step, pathname)) break;
        if (!step.element) break;
        const found = await waitForSelector(step.element, 2500);
        if (cancelled || myRun !== runId.current) return;
        if (found || queryVisible(step.element)) break;

        // Soft-nav can report /app/dashboard while SSR redirected away — abort
        // long skips and treat as gated bounce.
        const livePath = window.location.pathname;

        if (livePath !== pathname) {
          // React pathname lag after redirect — let effect re-run on real path.
          writeState({ ...parsed, index });
          return;
        }

        const bounce = readBounce();
        if (bounce && bounce.target === step.route) {
          const skippedTo = skipBlockedRoute(parsed.defs, index, step.route);
          writeBounce(null);
          index = skippedTo;
          writeState({ ...parsed, index });
          // Re-enter from new index (may need another nav).
          if (cancelled || myRun !== runId.current) return;
          if (index >= parsed.defs.length) {
            clearTour();
            return;
          }
          const nextCand = parsed.defs[index]!;
          if (nextCand.route && !stepFitsPath(nextCand, pathname)) {
            pendingNav.current = true;
            writeBounce({
              target: nextCand.route,
              index,
              from: pathname,
            });
            writeState({ ...parsed, index });
            router.push(tourHref(nextCand.route));
            return;
          }
          continue;
        }

        // Anchor still missing but page stayed: show as centered popover.
        break;
      }

      if (cancelled || myRun !== runId.current) return;

      if (index >= parsed.defs.length) {
        clearTour();
        return;
      }

      const current = parsed.defs[index]!;
      if (current.route && !stepFitsPath(current, pathname)) {
        pendingNav.current = true;
        writeBounce({
          target: current.route,
          index,
          from: pathname,
        });
        writeState({ ...parsed, index });
        router.push(tourHref(current.route));
        return;
      }

      // Chapter on this pathname. Missing anchors → centered popover (keep number).
      const localDefs: TourStepDef[] = [];
      const localIndexMap: number[] = [];
      for (let i = index; i < parsed.defs.length; i += 1) {
        const s = parsed.defs[i]!;
        if (s.route && !stepFitsPath(s, pathname)) break;
        if (s.element && !queryVisible(s.element)) {
          localDefs.push({ ...s, element: undefined });
        } else {
          localDefs.push(s);
        }
        localIndexMap.push(i);
      }

      if (localDefs.length === 0) {
        let nextIdx = index + 1;
        while (
          nextIdx < parsed.defs.length &&
          (!parsed.defs[nextIdx]!.route ||
            stepFitsPath(parsed.defs[nextIdx]!, pathname))
        ) {
          nextIdx += 1;
        }
        if (nextIdx >= parsed.defs.length) {
          clearTour();
          return;
        }
        const nextDef = parsed.defs[nextIdx]!;
        pendingNav.current = true;
        writeBounce({
          target: nextDef.route!,
          index: nextIdx,
          from: pathname,
        });
        writeState({ ...parsed, index: nextIdx });
        router.push(tourHref(nextDef.route!));
        return;
      }

      // Align stored index to the first playable local step.
      index = localIndexMap[0]!;
      writeState({ ...parsed, index });

      const lastLocalGlobal = localIndexMap[localDefs.length - 1]!;
      const moreAfterLocal = lastLocalGlobal < parsed.defs.length - 1;
      const doneLabel = moreAfterLocal ? props.labels.next : props.labels.done;
      const globalTotal = parsed.defs.length;

      // Tear down any overlapping instance after awaits (race-safe).
      destroyQuiet();

      const d = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        smoothScroll: true,
        skipMissingElement: false,
        overlayColor: "color-mix(in oklab, #0f172a 55%, transparent)",
        stagePadding: 10,
        stageRadius: 12,
        popoverClass: "ff-tour-popover",
        nextBtnText: props.labels.next,
        prevBtnText: props.labels.prev,
        doneBtnText: doneLabel,
        // Placeholders alone are chapter-local; onPopoverRender sets global N/M.
        progressText: "{{current}} / {{total}}",
        steps: localDefs.map((def, localIdx) => {
          const drive = toDriveStep(def);
          const globalIdx = localIndexMap[localIdx]!;
          return {
            ...drive,
            popover: {
              ...drive.popover,
              progressText: `${globalIdx + 1} / ${globalTotal}`,
            },
          };
        }),
        onPopoverRender: (popover, { index: localIdx }) => {
          const globalIdx = localIndexMap[localIdx ?? 0] ?? index;
          popover.progress.innerText = `${globalIdx + 1} / ${globalTotal}`;
        },
        onDestroyed: (_el, _step, opts) => {
          if (active.current === d) active.current = null;
          const reason = opts?.reason;
          if (
            silenceDestroy.current ||
            pendingNav.current ||
            keepStateOnDestroy.current
          ) {
            keepStateOnDestroy.current = false;
            return;
          }
          // Programmatic destroy() reports "api" — do not wipe resume state
          // (fixes race that cleared tour mid-chapter on tickets).
          if (reason === "api" || reason === "replaced") return;
          clearTour();
        },
        onNextClick: (_el, _step, { driver: drv }) => {
          void handleForward(drv);
        },
        onDoneClick: (_el, _step, { driver: drv }) => {
          void handleForward(drv);
        },
        onPrevClick: (_el, _step, { driver: drv }) => {
          const localIdx = drv.getActiveIndex() ?? 0;
          const globalIdx = localIndexMap[localIdx] ?? index;
          const prevGlobal = Math.max(0, globalIdx - 1);
          const prevDef = parsed.defs[prevGlobal];

          if (prevDef?.route && !stepFitsPath(prevDef, pathname)) {
            pendingNav.current = true;
            writeState({ ...parsed, index: prevGlobal });
            drv.destroy();
            router.push(tourHref(prevDef.route));
            return;
          }

          writeState({ ...parsed, index: prevGlobal });
          if (localIdx > 0) {
            drv.movePrevious();
            return;
          }
          keepStateOnDestroy.current = true;
          drv.destroy();
          window.dispatchEvent(new CustomEvent("ff-tour-start"));
        },
      });

      async function handleForward(drv: Driver) {
        const localIdx = drv.getActiveIndex() ?? 0;
        const globalIdx = localIndexMap[localIdx] ?? index;
        const nextGlobal = globalIdx + 1;
        const nextDef = parsed.defs[nextGlobal];

        if (!nextDef) {
          pendingNav.current = false;
          keepStateOnDestroy.current = false;
          clearTour();
          drv.destroy();
          return;
        }

        // Still on this page → advance inside local driver when next local exists.
        if (!nextDef.route || stepFitsPath(nextDef, pathname)) {
          writeState({ ...parsed, index: nextGlobal });
          const nextLocalPos = localIndexMap.indexOf(nextGlobal);
          if (nextLocalPos > localIdx && nextLocalPos < localDefs.length) {
            const nextLocal = localDefs[nextLocalPos];
            const anchorOk =
              !nextLocal?.element ||
              Boolean(queryVisible(nextLocal.element));
            if (anchorOk && nextLocalPos === localIdx + 1) {
              drv.moveNext();
              return;
            }
          }
          keepStateOnDestroy.current = true;
          drv.destroy();
          window.dispatchEvent(new CustomEvent("ff-tour-start"));
          return;
        }

        pendingNav.current = true;
        writeState({ ...parsed, index: nextGlobal });
        drv.destroy();
        router.push(tourHref(nextDef.route));
      }

      if (cancelled || myRun !== runId.current) {
        destroyQuiet();
        return;
      }

      active.current = d;
      d.drive(0);
    }

    function onStart() {
      void runFromStorage();
    }
    window.addEventListener("ff-tour-start", onStart);

    const existing = readState();
    let timer: number | undefined;
    if (existing) {
      timer = window.setTimeout(() => void runFromStorage(), 200);
    }

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("ff-tour-start", onStart);
      // Do not clear session state here — cleanup runs on every pathname change.
      destroyQuiet();
    };
  }, [pathname, router, props.audience, props.labels]);

  return null;
}
