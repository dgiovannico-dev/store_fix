"use client";

import { useEffect, useState } from "react";
import { startProductTour } from "@/features/product-tour/tour-launcher";

const KEY = "ff.emptyKpiTourDismissed";

type Props = {
  title: string;
  body: string;
  cta: string;
};

/** F9-09 — soft one-shot prompt to explain page when KPIs are empty. */
export function EmptyKpiTourPrompt({ title, body, cta }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(KEY)) return;
      setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-dashed border-[var(--border)] px-4 py-3 text-sm">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-[var(--muted-foreground)]">{body}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-[var(--radius)] bg-[var(--primary)] px-3 py-2 text-xs font-medium text-[var(--primary-foreground)]"
          onClick={() => {
            try {
              window.sessionStorage.setItem(KEY, "1");
            } catch {
              /* ignore */
            }
            setShow(false);
            startProductTour("hq", "page", "it");
          }}
        >
          {cta}
        </button>
        <button
          type="button"
          className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-xs"
          onClick={() => {
            try {
              window.sessionStorage.setItem(KEY, "1");
            } catch {
              /* ignore */
            }
            setShow(false);
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
