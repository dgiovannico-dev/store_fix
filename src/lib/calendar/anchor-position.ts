export type AnchorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
};

export type PopoverSize = { width: number; height: number };
export type ViewportSize = { width: number; height: number };

export type AnchoredPlacement = "right" | "left" | "bottom" | "top";

/**
 * Position a floating create/detail panel near a click/anchor rect
 * (Google Calendar–style), clamped inside the viewport.
 */
export function positionNearAnchor(
  anchor: AnchorRect,
  popover: PopoverSize,
  viewport: ViewportSize,
  gap = 8,
): { top: number; left: number; placement: AnchoredPlacement } {
  const candidates: Array<{
    placement: AnchoredPlacement;
    top: number;
    left: number;
  }> = [
    {
      placement: "right",
      top: anchor.top,
      left: anchor.right + gap,
    },
    {
      placement: "left",
      top: anchor.top,
      left: anchor.left - gap - popover.width,
    },
    {
      placement: "bottom",
      top: anchor.bottom + gap,
      left: anchor.left,
    },
    {
      placement: "top",
      top: anchor.top - gap - popover.height,
      left: anchor.left,
    },
  ];

  const fits = candidates.find(
    (c) =>
      c.left >= gap &&
      c.top >= gap &&
      c.left + popover.width <= viewport.width - gap &&
      c.top + popover.height <= viewport.height - gap,
  );

  const chosen = fits ?? candidates[0]!;
  return {
    placement: chosen.placement,
    left: clamp(chosen.left, gap, viewport.width - popover.width - gap),
    top: clamp(chosen.top, gap, viewport.height - popover.height - gap),
  };
}

export function rectFromDom(rect: DOMRect): AnchorRect {
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right,
  };
}

function clamp(n: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(n, min), max);
}
