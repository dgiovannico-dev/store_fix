import Link from "next/link";
import { headers } from "next/headers";
import { requestPasswordReset } from "@/domain/auth/password-reset";
import { requestMessages } from "@/i18n/request-locale";

export default async function ForgotPasswordPage() {
  const msg = (await requestMessages()).auth;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6">
        <h1 className="font-[family-name:var(--font-sora)] text-3xl font-semibold text-[var(--primary)]">
          FacilityFlow
        </h1>
        <p className="text-[var(--muted-foreground)]">{msg.forgotHint}</p>
        <form
          className="space-y-4"
          action={async (fd) => {
            "use server";
            await requestPasswordReset(
              String(fd.get("email") ?? ""),
              await headers(),
            );
          }}
        >
          <input
            name="email"
            type="email"
            required
            placeholder={msg.email}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5"
          />
          <button
            type="submit"
            className="w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-3 font-medium text-[var(--primary-foreground)]"
          >
            {msg.sendLink}
          </button>
        </form>
        <Link
          href="/login"
          className="text-sm text-[var(--primary)] underline-offset-4 hover:underline"
        >
          {msg.backLogin}
        </Link>
      </div>
    </main>
  );
}
