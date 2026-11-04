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
  intakeCategoryOptions,
  intakePriorityOptions,
} from "@/domain/intake/chat-steps";
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import { StatusPanel } from "@/components/ui/status-panel";
import { controlClass, textareaClass } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import type { Locale, MessageCatalog } from "@/i18n";

type StoreOpt = { id: string; name: string };
type AssetOpt = { id: string; label: string; storeId: string };

const initial: CreateTicketState = {};

export function NewTicketForm({
  msg,
  locale = "it",
}: {
  msg: MessageCatalog;
  locale?: Locale;
}) {
  const categories = intakeCategoryOptions(locale);
  const priorities = intakePriorityOptions(locale);
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
    <PageFrame narrow>
      <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        {copy.title}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{copy.hint}</p>

      {loading ? (
        <div className="mt-8">
          <StatusPanel kind="loading" locale={locale} />
        </div>
      ) : loadError ? (
        <div className="mt-8">
          <StatusPanel kind="error" title={loadError} locale={locale} />
        </div>
      ) : stores.length === 0 ? (
        <div className="mt-8">
          <StatusPanel kind="empty" title={copy.noStores} locale={locale}>
            <Link
              href="/app/stores"
              className="inline-block font-medium text-[var(--primary)] underline-offset-4 hover:underline"
            >
              {copy.addStore}
            </Link>
          </StatusPanel>
        </div>
      ) : (
        <form
          action={action}
          className="mt-6 space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6"
        >
          <Section title={copy.sectionWhere} hint={copy.sectionWhereHint}>
            <Field label={copy.storeField}>
              <select
                name="storeId"
                required
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className={controlClass}
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={copy.assetField}>
              <select
                name="assetId"
                className={controlClass}
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
          </Section>

          <Section title={copy.sectionWhat} hint={copy.sectionWhatHint}>
            <Field label={copy.categoryField}>
              <select
                name="category"
                required
                className={controlClass}
                defaultValue="frigo"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{copy.priorityField}</legend>
              <div className="grid grid-cols-2 gap-2">
                {priorities.map((p) => (
                  <label
                    key={p.value}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm has-[:checked]:border-[var(--primary)] has-[:checked]:bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]",
                    )}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={p.value}
                      defaultChecked={p.value === "normal"}
                      className="accent-[var(--primary)]"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </Section>

          <Section title={copy.sectionDetail} hint={copy.sectionDetailHint}>
            <Field label={copy.descriptionField}>
              <textarea
                name="description"
                required
                minLength={5}
                rows={4}
                placeholder={copy.descriptionPlaceholder}
                className={textareaClass}
              />
            </Field>
            <p className="text-xs text-[var(--muted-foreground)]">
              {copy.attachHint}
            </p>
          </Section>

          {state.error ? (
            <StatusPanel kind="error" title={state.error} locale={locale} />
          ) : null}

          <Button
            type="submit"
            disabled={pending}
            size="touch"
            className="sticky bottom-20 z-10 w-full shadow-sm sm:bottom-4"
          >
            {pending ? copy.submitting : copy.submit}
          </Button>
        </form>
      )}
    </PageFrame>
  );
}

function Section(props: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-b border-[var(--border)] pb-5 last:border-b-0 last:pb-0">
      <div>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {props.title}
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]">{props.hint}</p>
      </div>
      <div className="space-y-3">{props.children}</div>
    </section>
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
