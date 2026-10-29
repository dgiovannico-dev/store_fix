import Link from "next/link";
import { requestMessages } from "@/i18n/request-locale";

/** Fallback navigazione offline (F2-06) — nessuna scrittura SoR. */
export default async function OfflinePage() {
  const offline = (await requestMessages()).offline;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        {offline.title}
      </h1>
      <p className="mt-3 text-sm text-[var(--muted-foreground)]">{offline.body}</p>
      <p className="mt-6 text-sm">
        {offline.restorePrefix}{" "}
        <Link
          href="/app"
          className="font-medium text-[var(--primary)] underline-offset-4 hover:underline"
        >
          {offline.retry}
        </Link>
        {offline.restoreSuffix}
      </p>
    </main>
  );
}
