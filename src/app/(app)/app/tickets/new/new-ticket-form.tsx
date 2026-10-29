"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  createTicketAction,
  type CreateTicketState,
} from "@/app/actions/tickets";
import {
  INTAKE_CATEGORIES,
  intakeCategoryLabel,
  intakePriorityLabel,
  INTAKE_PRIORITIES,
} from "@/domain/intake/chat-steps";
import type { Locale, MessageCatalog } from "@/i18n";

type StoreOpt = { id: string; name: string };
type AssetOpt = { id: string; label: string; storeId: string };

const initial: CreateTicketState = {};

export function NewTicketForm({
  msg,
  locale,
}: {
  msg: MessageCatalog;
  locale: Locale;
}) {
  const [stores, setStores] = useState<StoreOpt[]>([]);
  const [assets, setAssets] = useState<AssetOpt[]>([]);
  const [storeId, setStoreId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, action, pending] = useActionState(createTicketAction, initial);
  const copy = msg.ticketsNew;

  useEffect(() => {
    let cancelled = false;
    const pref =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("storeId")
        : null;
    (async () => {
      try {
        const res = await fetch("/api/tickets/form-options");
        if (!res.ok) throw new Error(copy.loadStoresError);
        const data = (await res.json()) as {
          stores: StoreOpt[];
          assets: AssetOpt[];
        };
        if (cancelled) return;
        setStores(data.stores);
        setAssets(data.assets);
        const fromPref = pref && data.stores.some((s) => s.id === pref);
        if (fromPref && pref) setStoreId(pref);
        else if (data.stores[0]) setStoreId(data.stores[0].id);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : copy.loadError);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [copy.loadError, copy.loadStoresError]);

  const storeAssets = assets.filter((a) => a.storeId === storeId);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[390px] px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/app/tickets"
          className="text-sm text-[var(--muted-foreground)]"
        >
          {copy.back}
        </Link>
        <span className="text-xs text-[var(--muted-foreground)]">
          {copy.badge}
        </span>
      </div>

      <h1 className="mt-4 font-[family-name:var(--font-sora)] text-xl font-semibold text-[var(--primary)]">
        {copy.title}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{copy.hint}</p>

      {loading ? (
        <p className="mt-8 text-sm text-[var(--muted-foreground)]">
          {msg.common.loading}
        </p>
      ) : loadError ? (
        <p className="mt-8 text-sm text-[var(--critical)]" role="alert">
          {loadError}
        </p>
      ) : stores.length === 0 ? (
        <div className="mt-8 space-y-3 text-sm">
          <p className="text-[var(--muted-foreground)]">{copy.noStores}</p>
          <Link
            href="/app/stores"
            className="inline-block font-medium text-[var(--primary)] underline-offset-4 hover:underline"
          >
            {copy.addStore}
          </Link>
        </div>
      ) : (
        <form action={action} className="mt-6 space-y-4">
          <Field label={copy.storeField}>
            <select
              name="storeId"
              required
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-3 text-base"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={copy.categoryField}>
            <select
              name="category"
              required
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-3 text-base"
              defaultValue="frigo"
            >
              {INTAKE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {intakeCategoryLabel(c.value, locale)}
                </option>
              ))}
            </select>
          </Field>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{copy.priorityField}</legend>
            <div className="grid grid-cols-2 gap-2">
              {INTAKE_PRIORITIES.map((p) => (
                <label
                  key={p.value}
                  className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p.value}
                    defaultChecked={p.value === "normal"}
                  />
                  {intakePriorityLabel(p.value, locale)}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label={copy.assetField}>
            <select
              name="assetId"
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-3 text-base"
              defaultValue=""
            >
              <option value="">—</option>
              {storeAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label={copy.descriptionField}>
            <textarea
              name="description"
              required
              minLength={5}
              rows={4}
              placeholder={copy.descriptionPlaceholder}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-3 text-base"
            />
          </Field>

          <p className="text-xs text-[var(--muted-foreground)]">
            {copy.attachHint}
          </p>

          {state.error ? (
            <p className="text-sm text-[var(--critical)]" role="alert">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="sticky bottom-4 w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-3.5 text-base font-medium text-[var(--primary-foreground)] disabled:opacity-60"
          >
            {pending ? copy.submitting : copy.submit}
          </button>
        </form>
      )}
    </main>
  );
}

function Field(props: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{props.label}</label>
      {props.children}
    </div>
  );
}
