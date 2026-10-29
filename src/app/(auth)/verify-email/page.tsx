import Link from "next/link";
import { confirmEmailVerification } from "@/domain/tenancy/email-verification";

type Props = {
  searchParams: Promise<{ token?: string; email?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token, email } = await searchParams;

  let status: "ok" | "invalid" | "expired" | "missing" = "missing";
  if (token && email) {
    const result = await confirmEmailVerification(email, token);
    if (result.ok) status = "ok";
    else status = result.code === "EXPIRED" ? "expired" : "invalid";
  }

  const copy =
    status === "ok"
      ? "Email confermata. Puoi accedere al workspace."
      : status === "expired"
        ? "Il link di conferma è scaduto. Richiedine uno nuovo dall'account."
        : status === "invalid"
          ? "Link non valido."
          : "Manca il token di conferma.";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-16">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        FacilityFlow
      </h1>
      <p className={status === "ok" ? "text-[var(--success)]" : "text-[var(--critical)]"}>
        {copy}
      </p>
      <Link
        href="/login"
        className="w-fit rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
      >
        Vai al login
      </Link>
    </main>
  );
}
