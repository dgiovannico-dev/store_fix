"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { acceptInviteAction } from "@/app/actions/invite";
import { StatusPanel } from "@/components/ui/status-panel";
import { useLocale, useMessages } from "@/i18n/locale-context";

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const msg = useMessages().auth;
  const locale = useLocale();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <h1 className="font-[family-name:var(--font-sora)] text-3xl font-semibold text-[var(--primary)]">
        FacilityFlow
      </h1>
      <p className="text-[var(--muted-foreground)]">{msg.inviteHint}</p>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          const fd = new FormData(e.currentTarget);
          const res = await acceptInviteAction({
            token: token!,
            name: String(fd.get("name") ?? ""),
            password: String(fd.get("password") ?? ""),
          });
          setPending(false);
          if (!res.ok) {
            setError(res.message);
            return;
          }
          router.push("/login");
        }}
      >
        <input
          name="name"
          required
          placeholder={msg.namePlaceholder}
          className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2.5"
        />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder={msg.password}
          className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2.5"
        />
        {error ? (
          <StatusPanel kind="error" title={error} locale={locale} />
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-3 font-medium text-[var(--primary-foreground)] disabled:opacity-60"
        >
          {pending ? msg.accepting : msg.acceptInvite}
        </button>
      </form>
      <Link href="/login" className="text-sm text-[var(--muted-foreground)]">
        {msg.inviteHaveAccount}
      </Link>
    </main>
  );
}
