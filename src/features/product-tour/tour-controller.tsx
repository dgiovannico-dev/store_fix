"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver, type Driver } from "driver.js";
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
  window.sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ audience, mode, index: 0, defs }),
  );
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
        "Vuoi un tutorial interattivo di FacilityFlow? (Puoi rilanciarlo da Aiuto o col tasto ?)",
      );
      window.localStorage.setItem(SOFT_KEY, ok ? "started" : "later");
      if (ok) startProductTour(props.audience, "full");
    }, 1200);
    return () => window.clearTimeout(id);
  }, [props.audience, props.softPrompt]);

  useEffect(() => {
    function runFromStorage() {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      let parsed: {
        audience: TourAudience;
        mode: "full" | "page";
        index: number;
        defs: TourStepDef[];
      };
      try {
        parsed = JSON.parse(raw) as typeof parsed;
      } catch {
        return;
      }

      active.current?.destroy();
      navigating.current = false;

      const steps = parsed.defs
        .map((d) => {
          if (!d.element) {
            return {
              popover: {
                title: d.title,
                description: d.description,
              },
            };
          }
          return {
            element: d.element,
            popover: {
              title: d.title,
              description: d.description,
            },
          };
        })
        .filter((s) => {
          if (!("element" in s) || !s.element) return true;
          return Boolean(document.querySelector(s.element));
        });

      if (steps.length === 0) {
        window.sessionStorage.removeItem(STORAGE_KEY);
        return;
      }

      const d = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: "color-mix(in oklab, #0f172a 55%, transparent)",
        stagePadding: 8,
        stageRadius: 10,
        popoverClass: "ff-tour-popover",
        nextBtnText: "Avanti",
        prevBtnText: "Indietro",
        doneBtnText: "Fine",
        progressText: "{{current}} / {{total}}",
        steps,
        onDestroyed: () => {
          if (!navigating.current) {
            window.sessionStorage.removeItem(STORAGE_KEY);
          }
          active.current = null;
        },
        onNextClick: (_el, _step, { driver: drv }) => {
          const idx = drv.getActiveIndex() ?? 0;
          const nextDef = parsed.defs[idx + 1];
          if (nextDef?.route && nextDef.route !== pathname) {
            navigating.current = true;
            window.sessionStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ ...parsed, index: idx + 1 }),
            );
            drv.destroy();
            router.push(nextDef.route);
            return;
          }
          drv.moveNext();
        },
      });
      active.current = d;
      const startAt = Math.min(parsed.index ?? 0, Math.max(0, steps.length - 1));
      d.drive(startAt);
    }

    function onStart() {
      runFromStorage();
    }
    window.addEventListener("ff-tour-start", onStart);
    // resume after navigation
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const t = window.setTimeout(runFromStorage, 400);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("ff-tour-start", onStart);
        active.current?.destroy();
      };
    }
    return () => {
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
