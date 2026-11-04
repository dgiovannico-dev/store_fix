"use client";

import { CircleHelp } from "lucide-react";
import type { Locale } from "@/i18n";
import { startProductTour } from "@/features/product-tour/tour-launcher";

/** CTA on onboarding: one click starts the interactive HQ tour. */
export function OnboardingTourLaunch(props: {
  label: string;
  hint: string;
  cta: string;
  locale?: Locale;
}) {
  return (
    <button
      type="button"
      onClick={() => startProductTour("hq", "full", props.locale ?? "it")}
      className="group flex w-full max-w-xl cursor-pointer items-center gap-3 rounded-[calc(var(--radius)+2px)] border border-[color-mix(in_oklab,var(--primary)_32%,var(--border))] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_14%,var(--card)),var(--card))] px-3.5 py-3 text-left shadow-[0_1px_2px_color-mix(in_oklab,var(--primary)_12%,transparent)] transition-[border-color,box-shadow,transform] hover:border-[color-mix(in_oklab,var(--primary)_48%,var(--border))] hover:shadow-[0_4px_14px_color-mix(in_oklab,var(--primary)_14%,transparent)] active:scale-[0.99]"
      aria-label={props.label}
    >
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm transition-transform group-hover:scale-105">
        <CircleHelp className="size-5" aria-hidden strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-[family-name:var(--font-sora)] text-sm font-semibold text-[var(--primary)]">
          {props.label}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-[var(--muted-foreground)]">
          {props.hint}
        </span>
      </span>
      <span
        className="shrink-0 rounded-full bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)]"
        aria-hidden
      >
        {props.cta}
      </span>
    </button>
  );
}
