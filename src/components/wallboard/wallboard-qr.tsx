"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  href: string;
  hint: string;
};

/** F9-08 — QR to open tickets in app. */
export function WallboardQr({ href, hint }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(href, { margin: 1, width: 128 }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [href]);

  if (!dataUrl) return null;

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="" width={96} height={96} className="rounded" />
      <p className="max-w-[10rem] text-xs text-[var(--muted-foreground)]">
        {hint}
      </p>
    </div>
  );
}
