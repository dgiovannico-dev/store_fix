"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver, type DriveStep, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "@/features/product-tour/tour.css";
import {
  chapterForPath,
  stepsForAudience,
  type TourAudience,
  type TourStepDef,
} from "./tour-registry";

const STORAGE_KEY = "ff.tour.resume";
const SOFT_KEY = "ff.tour.softprompt";

type TourState = {
  audience: TourAudience;
  mode: "full" | "page";
  /** Index into `defs` (not filtered). */
  index: number;
  defs: TourStepDef[];
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
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  return {
    element: d.element,
    popover,
  };
}

export function startProductTour(
  audience: TourAudience,
  mode: "full" | "page" = "full",
) {
  if (typeof window === "undefined") return;
  const pathname = window.location.pathname;
  const defs =
    mode === "page"
      ? chapterForPath(audience, pathname)
      : stepsForAudience(audience);

  let index = 0;
  const first = defs[0];
  if (first?.route && first.route !== pathname) {
    writeState({ audience, mode, index: 0, defs });
    window.location.assign(first.route);
    return;
  }

  writeState({ audience, mode, index, defs });
  window.dispatchEvent(new CustomEvent("ff-tour-start"));
}

export function ProductTourHost(props: {
  audience: TourAudience;
  softPrompt?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const active = useRef<Driver | null>(null);
  const navigating = useRef(false);

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
      startProductTour(props.audience, "full");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.audience]);

  useEffect(() => {
    if (!props.softPrompt) return;
    if (window.localStorage.getItem(SOFT_KEY)) return;
    const id = window.setTimeout(() => {
      const ok = window.confirm(
        "Vuoi un tutorial guidato di FacilityFlow?\n\nTi accompagna sezione per sezione (puoi chiudere e ripartire da Aiuto o col tasto ?).",
      );
      window.localStorage.setItem(SOFT_KEY, ok ? "started" : "later");
      if (ok) startProductTour(props.audience, "full");
    }, 1400);
    return () => window.clearTimeout(id);
  }, [props.audience, props.softPrompt]);

  useEffect(() => {
    let cancelled = false;

    async function waitForSelector(
      selector: string,
      ms = 6000,
    ): Promise<Element | null> {
      const start = Date.now();
      while (Date.now() - start < ms) {
        if (cancelled) return null;
        const el = document.querySelector(selector);
        if (el) return el;
        await new Promise((r) => setTimeout(r, 80));
      }
      return document.querySelector(selector);
    }

    async function runFromStorage() {
      const parsed = readState();
      if (!parsed || cancelled) return;

      active.current?.destroy();
      navigating.current = false;

      let index = Math.min(
        Math.max(0, parsed.index),
        Math.max(0, parsed.defs.length - 1),
      );
      let step = parsed.defs[index];
      if (!step) {
        writeState(null);
        return;
      }

      // Se lo step richiede un'altra route, naviga e riprendi.
      if (step.route && step.route !== pathname) {
        navigating.current = true;
        writeState({ ...parsed, index });
        router.push(step.route);
        return;
      }

      if (step.element) {
        await waitForSelector(step.element);
      }

      // Salta ancore assenti (RBAC / empty) restando sulla stessa route.
      while (
        step?.element &&
        !document.querySelector(step.element) &&
        index < parsed.defs.length - 1
      ) {
        const next = parsed.defs[index + 1];
        if (next?.route && next.route !== pathname) break;
        index += 1;
        step = parsed.defs[index];
        if (step?.element) await waitForSelector(step.element, 1500);
      }

      if (!step) {
        writeState(null);
        return;
      }

      const driveSteps = parsed.defs.map(toDriveStep);

      const d = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        smoothScroll: true,
        overlayColor: "color-mix(in oklab, #0f172a 55%, transparent)",
        stagePadding: 10,
        stageRadius: 12,
        popoverClass: "ff-tour-popover",
        nextBtnText: "Avanti",
        prevBtnText: "Indietro",
        doneBtnText: "Ho capito",
        progressText: "{{current}} / {{total}}",
        steps: driveSteps,
        onDestroyed: () => {
          if (!navigating.current) writeState(null);
          active.current = null;
        },
        onNextClick: (_el, _step, { driver: drv }) => {
          const idx = drv.getActiveIndex() ?? index;
          const nextIdx = idx + 1;
          const nextDef = parsed.defs[nextIdx];
          if (!nextDef) {
            drv.destroy();
            return;
          }
          if (nextDef.route && nextDef.route !== pathname) {
            navigating.current = true;
            writeState({ ...parsed, index: nextIdx });
            drv.destroy();
            router.push(nextDef.route);
            return;
          }
          writeState({ ...parsed, index: nextIdx });
          drv.moveNext();
        },
        onPrevClick: (_el, _step, { driver: drv }) => {
          const idx = drv.getActiveIndex() ?? index;
          const prevIdx = Math.max(0, idx - 1);
          const prevDef = parsed.defs[prevIdx];
          if (prevDef?.route && prevDef.route !== pathname) {
            navigating.current = true;
            writeState({ ...parsed, index: prevIdx });
            drv.destroy();
            router.push(prevDef.route);
            return;
          }
          writeState({ ...parsed, index: prevIdx });
          drv.movePrevious();
        },
      });

      if (cancelled) {
        d.destroy();
        return;
      }
      active.current = d;
      writeState({ ...parsed, index });
      d.drive(index);
    }

    function onStart() {
      void runFromStorage();
    }
    window.addEventListener("ff-tour-start", onStart);

    const existing = readState();
    let timer: number | undefined;
    if (existing) {
      timer = window.setTimeout(() => void runFromStorage(), 350);
    }

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("ff-tour-start", onStart);
      active.current?.destroy();
    };
  }, [pathname, router, props.audience]);

  return null;
}

export function TourHelpButtons(props: {
  audience: TourAudience;
  label: string;
  pageLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-2" data-tour="help.tour">
      <button
        type="button"
        className="rounded-[var(--radius)] px-3 py-2 text-left text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
        onClick={() => startProductTour(props.audience, "full")}
      >
        {props.label}
      </button>
      <button
        type="button"
        className="rounded-[var(--radius)] px-3 py-2 text-left text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
        onClick={() => startProductTour(props.audience, "page")}
      >
        {props.pageLabel}
      </button>
    </div>
  );
}
