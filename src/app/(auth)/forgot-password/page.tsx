import Link from "next/link";
import { headers } from "next/headers";
import { requestPasswordReset } from "@/domain/auth/password-reset";
import { Input } from "@/components/ui/input";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { requestMessages } from "@/i18n/request-locale";

export default async function ForgotPasswordPage() {
  const msg = (await requestMessages()).auth;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.92_0.03_75/0.55),transparent_50%),linear-gradient(165deg,oklch(0.97_0.01_95),oklch(0.94_0.015_250))]"
      />
      <div className="relative z-10 w-full max-w-md space-y-6">
        <h1 className="font-[family-name:var(--font-sora)] text-4xl font-semibold text-[var(--primary)]">
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
          <Input
            name="email"
            type="email"
            required
            placeholder={msg.email}
            autoComplete="email"
          />
          <PendingSubmitButton
            size="lg"
            className="w-full"
            label={msg.sendLink}
            pendingLabel={msg.sendingLink}
          />
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
