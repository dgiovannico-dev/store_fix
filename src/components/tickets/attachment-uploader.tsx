"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ACCEPT = "image/jpeg,image/png,image/webp";

type Props = { ticketId: string };

export function AttachmentUploader({ ticketId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    setOkMsg(null);
    try {
      for (const file of Array.from(files)) {
        const presignRes = await fetch(
          `/api/tickets/${ticketId}/attachments/presign`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              mime: file.type,
              sizeBytes: file.size,
            }),
          },
        );
        const presign = (await presignRes.json()) as {
          ok?: boolean;
          error?: string;
          uploadUrl?: string;
          storageKey?: string;
          mime?: string;
        };
        if (!presignRes.ok || !presign.uploadUrl || !presign.storageKey) {
          throw new Error(presign.error ?? "Presign fallito");
        }

        const put = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!put.ok) {
          throw new Error(`Upload storage fallito (${put.status})`);
        }

        const confirmRes = await fetch(
          `/api/tickets/${ticketId}/attachments/confirm`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storageKey: presign.storageKey,
              mime: file.type,
              sizeBytes: file.size,
            }),
          },
        );
        const confirm = (await confirmRes.json()) as {
          ok?: boolean;
          error?: string;
        };
        if (!confirmRes.ok || !confirm.ok) {
          throw new Error(confirm.error ?? "Conferma allegato fallita");
        }
      }
      setOkMsg("Foto caricate");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore upload");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Aggiungi foto
        <input
          type="file"
          accept={ACCEPT}
          multiple
          disabled={busy}
          onChange={onChange}
          className="mt-1 block w-full text-sm file:mr-3 file:rounded-[var(--radius)] file:border-0 file:bg-[var(--primary)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--primary-foreground)]"
        />
      </label>
      <p className="text-xs text-[var(--muted-foreground)]">
        JPEG, PNG o WebP · max 10 MB ciascuna
      </p>
      {busy ? (
        <p className="text-sm text-[var(--muted-foreground)]">Caricamento…</p>
      ) : null}
      {error ? (
        <p className="text-sm text-[var(--critical)]" role="alert">
          {error}
        </p>
      ) : null}
      {okMsg ? (
        <p className="text-sm text-[var(--success)]" role="status">
          {okMsg}
        </p>
      ) : null}
    </div>
  );
}
