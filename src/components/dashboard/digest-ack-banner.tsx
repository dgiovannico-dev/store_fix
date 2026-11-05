"use client";

import { ackDigestAction } from "@/app/actions/digest-ack";

type Props = {
  weekKey: string;
  title: string;
  body: string;
  cta: string;
};

export function DigestAckBanner({ weekKey, title, body, cta }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-[var(--muted-foreground)]">{body}</p>
      </div>
      <form action={ackDigestAction}>
        <input type="hidden" name="weekKey" value={weekKey} />
        <button
          type="submit"
          className="rounded-[var(--radius)] bg-[var(--primary)] px-3 py-2 text-xs font-medium text-[var(--primary-foreground)]"
        >
          {cta}
        </button>
      </form>
    </div>
  );
}
