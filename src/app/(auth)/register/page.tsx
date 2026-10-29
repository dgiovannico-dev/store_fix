"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction, type SignupActionState } from "@/app/actions/signup";
import { StatusPanel } from "@/components/ui/status-panel";
import { useLocale, useMessages } from "@/i18n/locale-context";

const initial: SignupActionState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signupAction, initial);
  const msg = useMessages().auth;
  const locale = useLocale();

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_15%,oklch(0.92_0.03_75/0.5),transparent_48%),radial-gradient(ellipse_at_20%_85%,oklch(0.93_0.02_250/0.65),transparent_40%),linear-gradient(165deg,oklch(0.97_0.01_95),oklch(0.94_0.015_250))]"
      />

      <div className="relative z-10 w-full max-w-md">
        <p className="font-[family-name:var(--font-sora)] text-4xl font-semibold tracking-tight text-[var(--primary)] sm:text-5xl">
          FacilityFlow
        </p>
        <p className="mt-3 text-[var(--muted-foreground)]">{msg.registerHint}</p>

        <form action={formAction} className="mt-10 space-y-4">
          <Field
            id="workspaceName"
            name="workspaceName"
            label={msg.workspaceName}
            placeholder={msg.workspacePlaceholder}
            required
          />
          <Field id="name" name="name" label={msg.yourName} required />
          <Field
            id="email"
            name="email"
            label={msg.workEmail}
            type="email"
            autoComplete="email"
            required
          />
          <Field
            id="password"
            name="password"
            label={msg.password}
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />

          {state.error ? (
            <StatusPanel kind="error" title={state.error} locale={locale} />
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-3 text-base font-medium text-[var(--primary-foreground)] transition hover:opacity-90 disabled:opacity-60"
          >
            {pending ? msg.creating : msg.createWorkspace}
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--muted-foreground)]">
          {msg.haveAccount}{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--primary)] underline-offset-4 hover:underline"
          >
            {msg.signIn}
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field(props: {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={props.id}
        className="block text-sm font-medium text-[var(--foreground)]"
      >
        {props.label}
      </label>
      <input
        id={props.id}
        name={props.name}
        type={props.type ?? "text"}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        minLength={props.minLength}
        required={props.required}
        className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5 text-base outline-none ring-[var(--ring)] focus:ring-2"
      />
    </div>
  );
}
