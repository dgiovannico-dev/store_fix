import Link from "next/link";
import { requestPasswordReset } from "@/domain/auth/password-reset";

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6">
        <h1 className="font-[family-name:var(--font-sora)] text-3xl font-semibold text-[var(--primary)]">
          FacilityFlow
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Inserisci l&apos;email: se esiste un account, riceverai un link per
          reimpostare la password.
        </p>
        <form
          className="space-y-4"
          action={async (fd) => {
            "use server";
            await requestPasswordReset(String(fd.get("email") ?? ""));
          }}
        >
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5"
          />
          <button
            type="submit"
            className="w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-3 font-medium text-[var(--primary-foreground)]"
          >
            Invia link
          </button>
        </form>
        <Link href="/login" className="text-sm text-[var(--primary)] underline-offset-4 hover:underline">
          Torna al login
        </Link>
      </div>
    </main>
  );
}
