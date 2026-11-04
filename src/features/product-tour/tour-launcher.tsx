"use client";

/**
 * Lightweight tour entrypoints for the HQ/phone shell.
 * Intentionally does NOT import driver.js — that stays in tour-controller
 * (loaded via next/dynamic) so every soft-nav does not pay the tour chunk.
 */

import { CircleHelp } from "lucide-react";
import type { Locale } from "@/i18n";
import {
  chapterForPath,
  stepsForAudience,
  type TourAudience,
  type TourStepDef,
} from "./tour-registry";

const STORAGE_KEY = "ff.tour.resume";

type TourState = {
  audience: TourAudience;
  mode: "full" | "page";
  index: number;
  defs: TourStepDef[];
};

function tourHref(route: string): string {
  if (route.includes("?")) {
    return `${route}&tour=1`;
  }
  return `${route}?tour=1`;
}

function writeState(state: TourState) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function startProductTour(
  audience: TourAudience,
  mode: "full" | "page" = "full",
  locale: Locale = "it",
) {
  if (typeof window === "undefined") return;
  const pathname = window.location.pathname;
  const defs =
    mode === "page"
      ? chapterForPath(audience, pathname, locale)
      : stepsForAudience(audience, locale);

  const first = defs[0];
  if (first?.route && first.route !== pathname) {
    writeState({ audience, mode, index: 0, defs });
    window.location.assign(tourHref(first.route));
    return;
  }

  writeState({ audience, mode, index: 0, defs });
  window.dispatchEvent(new CustomEvent("ff-tour-start"));
}

export function TourHelpButtons(props: {
  audience: TourAudience;
  label: string;
  pageLabel: string;
  pageScopeHint: string;
  locale: Locale;
}) {
  return (
    <div className="flex flex-col gap-1.5 p-2" data-tour="help.tour">
      <button
        type="button"
        className="flex cursor-pointer items-center gap-2.5 rounded-full border border-[color-mix(in_oklab,var(--primary)_30%,var(--border))] bg-[var(--primary-soft)] px-3 py-2 text-left text-sm font-medium text-[var(--primary)] shadow-sm transition-colors hover:bg-[var(--sidebar-accent)]"
        onClick={() => startProductTour(props.audience, "full", props.locale)}
      >
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
          <CircleHelp className="size-3.5" aria-hidden strokeWidth={2.25} />
        </span>
        {props.label}
      </button>
      <button
        type="button"
        className="flex cursor-pointer items-center gap-2.5 rounded-full border border-[var(--sidebar-border)] bg-[var(--card)] px-3 py-2 text-left text-sm text-[var(--foreground)] shadow-sm transition-colors hover:border-[var(--chrome-border)] hover:bg-[var(--accent)]"
        onClick={() => startProductTour(props.audience, "page", props.locale)}
      >
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--sidebar-border)] bg-[var(--sidebar-accent)] text-[var(--nav-icon-active)]">
          <CircleHelp className="size-3.5" aria-hidden strokeWidth={2} />
        </span>
        <span className="min-w-0 leading-snug">
          <span className="block font-medium">{props.pageLabel}</span>
          <span className="block text-[11px] font-normal text-[var(--muted-foreground)]">
            {props.pageScopeHint}
          </span>
        </span>
      </button>
    </div>
  );
}
