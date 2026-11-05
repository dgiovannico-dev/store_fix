type Props = { text: string };

/** F9-07 — trust strip (UE / GDPR / AI human-confirm). */
export function TrustStrip({ text }: Props) {
  return (
    <p
      className="px-3 py-2 text-[10px] leading-snug text-[var(--muted-foreground)]"
      data-tour="trust.strip"
    >
      {text}
    </p>
  );
}
