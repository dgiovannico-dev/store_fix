"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  importStoresAction,
  type ImportState,
} from "@/app/actions/stores-import";
import type { MessageCatalog } from "@/i18n";

const initial: ImportState = {};

export function StoreImportForm({ msg }: { msg: MessageCatalog }) {
  const [state, action, pending] = useActionState(importStoresAction, initial);
  const copy = msg.storeImport;

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <p className="text-sm text-[var(--muted-foreground)]">
        <Link href="/app/stores" className="underline-offset-4 hover:underline">
          {copy.back}
        </Link>
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        {copy.title}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        {copy.hintBefore}{" "}
        <a
          href="/templates/stores.it.csv"
          className="font-medium text-[var(--primary)] underline-offset-4 hover:underline"
        >
          {copy.templateLink}
        </a>
        {copy.hintAfter}
      </p>

      <form action={action} className="mt-8 space-y-4">
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="block w-full text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
        >
          {pending ? copy.submitting : copy.submit}
        </button>
      </form>

      {state.error ? (
        <p className="mt-4 text-sm text-[var(--critical)]" role="alert">
          {state.error}
        </p>
      ) : null}

      {typeof state.imported === "number" ? (
        <div className="mt-6 space-y-2 text-sm">
          <p>
            {copy.imported} <strong>{state.imported}</strong>
          </p>
          {state.errors && state.errors.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-[var(--critical)]">
              {state.errors.map((e) => (
                <li key={`${e.line}-${e.message}`}>
                  {e.line > 0 ? `${copy.linePrefix} ${e.line}: ` : null}
                  {e.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[var(--success)]">{copy.noValidationErrors}</p>
          )}
        </div>
      ) : null}
    </main>
  );
}
