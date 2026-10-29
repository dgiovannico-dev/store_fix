"use client";

import { useState } from "react";
import { StatusPanel } from "@/components/ui/status-panel";
import type { Locale, MessageCatalog } from "@/i18n";

type Item = {
  id: string;
  mime: string;
  sizeBytes: number;
};

type Props = {
  ticketId: string;
  items: Item[];
  labels: MessageCatalog["ticketPanels"];
  /** Passare da catalogo (`ticketDetail.photos`) — niente default IT. */
  photoWord: string;
  locale?: Locale;
};

export function AttachmentGallery({
  ticketId,
  items,
  labels,
  photoWord,
  locale = "it",
}: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function open(id: string) {
    if (urls[id]) {
      window.open(urls[id], "_blank", "noopener,noreferrer");
      return;
    }
    setError(null);
    const res = await fetch(
      `/api/tickets/${ticketId}/attachments/${id}/url`,
    );
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      setError(data.error ?? labels.galleryDownloadFail);
      return;
    }
    setUrls((prev) => ({ ...prev, [id]: data.url! }));
    window.open(data.url, "_blank", "noopener,noreferrer");
  }

  if (items.length === 0) {
    return (
      <StatusPanel
        kind="empty"
        title={labels.galleryEmpty}
        locale={locale}
      />
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {items.map((a, i) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => open(a.id)}
              className="text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
            >
              {photoWord} {i + 1} · {a.mime.replace("image/", "")} ·{" "}
              {Math.round(a.sizeBytes / 1024)} KB
            </button>
          </li>
        ))}
      </ul>
      {error ? (
        <StatusPanel
          kind="error"
          title={error}
          locale={locale}
        />
      ) : null}
    </div>
  );
}
