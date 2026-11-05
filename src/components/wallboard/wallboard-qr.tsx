"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  href: string;
  hint: string;
};

/** F9-08 — QR to open tickets in app (same card height as count strip). */
export function WallboardQr({ href, hint }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(href, { margin: 1, width: 96 }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [href]);

  return (
    <div
      className="flex min-h-[5.75rem] items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-5 py-3"
      data-tour="hq.wallboard.qr"
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0 rounded"
        />
      ) : (
        <div
          className="size-14 shrink-0 animate-pulse rounded bg-[var(--muted)]"
          aria-hidden
        />
      )}
      <p className="max-w-[10rem] text-xs leading-snug text-[var(--muted-foreground)]">
        {hint}
      </p>
    </div>
  );
}
