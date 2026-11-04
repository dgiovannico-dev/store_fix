"use client";

import { useLayoutEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  positionNearAnchor,
  type AnchorRect,
} from "@/lib/calendar/anchor-position";
import { cn } from "@/lib/utils";

const POPOVER_WIDTH = 320;

/**
 * Non-modal dialog floated near a calendar click (GCal-style quick create).
 */
export function CalendarAnchorDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor: AnchorRect | null;
  title: string;
  closeLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!props.open || !props.anchor) return;

    const measure = () => {
      const height = contentRef.current?.offsetHeight ?? 380;
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      const next = positionNearAnchor(
        props.anchor!,
        { width: POPOVER_WIDTH, height },
        viewport,
      );
      setCoords({ top: next.top, left: next.left });
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [props.open, props.anchor]);

  return (
    <DialogPrimitive.Root
      open={props.open}
      onOpenChange={props.onOpenChange}
      modal={false}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          ref={contentRef}
          aria-describedby={undefined}
          style={{
            top: coords.top,
            left: coords.left,
            width: POPOVER_WIDTH,
          }}
          className={cn(
            "fixed z-50 max-h-[min(34rem,calc(100vh-1rem))] overflow-y-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-xl outline-none",
            props.className,
          )}
          onOpenAutoFocus={(e) => {
            const root = e.currentTarget as HTMLElement;
            const focusable = root.querySelector<HTMLElement>(
              "input, select, textarea, button",
            );
            if (focusable) {
              e.preventDefault();
              focusable.focus();
            }
          }}
        >
          <div className="mb-3 flex items-start justify-between gap-2 pr-6">
            <DialogPrimitive.Title className="font-[family-name:var(--font-sora)] text-base font-semibold text-[var(--primary)]">
              {props.title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="absolute right-2 top-2 rounded-[var(--radius)] p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
              <X className="size-4" aria-hidden />
              <span className="sr-only">{props.closeLabel}</span>
            </DialogPrimitive.Close>
          </div>
          {props.children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
