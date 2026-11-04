import Link from "next/link";
import { confirmEmailVerification } from "@/domain/tenancy/email-verification";
import { AuthMistWash } from "@/components/auth/auth-mist-wash";
import { requestMessages } from "@/i18n/request-locale";

type Props = {
  searchParams: Promise<{ token?: string; email?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token, email } = await searchParams;
  const msg = (await requestMessages()).auth;

  let status: "ok" | "invalid" | "expired" | "missing" = "missing";
  if (token && email) {
    const result = await confirmEmailVerification(email, token);
    if (result.ok) status = "ok";
    else status = result.code === "emailVerifyExpired" ? "expired" : "invalid";
  }

  const copy =
    status === "ok"
      ? msg.verifyOk
      : status === "expired"
        ? msg.verifyExpired
        : status === "invalid"
          ? msg.verifyInvalid
          : msg.verifyMissing;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16">
      <AuthMistWash />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-6">
        <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
          FacilityFlow
        </h1>
        <p
          className={
            status === "ok" ? "text-[var(--success)]" : "text-[var(--critical)]"
          }
        >
          {copy}
        </p>
        <Link
          href="/login"
          className="w-fit rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
        >
          {msg.goLogin}
        </Link>
      </div>
    </main>
  );
}
