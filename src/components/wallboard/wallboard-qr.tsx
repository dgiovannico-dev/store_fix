type Props = {
  /** SVG markup from `qrSvgMarkup` (RSC). */
  svg: string;
  hint: string;
};

/** F9-08 — QR to open tickets in app (same card height as count strip). */
export function WallboardQr({ svg, hint }: Props) {
  return (
    <div
      className="flex min-h-[5.75rem] items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-5 py-3"
      data-tour="hq.wallboard.qr"
    >
      <div
        className="size-14 shrink-0 overflow-hidden rounded [&_svg]:block [&_svg]:size-full"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="max-w-[10rem] text-xs leading-snug text-[var(--muted-foreground)]">
        {hint}
      </p>
    </div>
  );
}
