import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { updateStoreAction } from "@/app/actions/stores";
import { canMutate } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { prisma } from "@/infrastructure/db/prisma";
import { tenantMessages } from "@/i18n/tenant-messages";

export default async function StoreEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!canMutate(session.role, RbacAction.crudStore)) {
    redirect("/app/stores");
  }

  const { id } = await params;
  const store = await prisma.store.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
  });
  if (!store) notFound();

  const msg = await tenantMessages(session.tenantId);
  const copy = msg.stores;

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <p className="text-sm">
        <Link
          href="/app/stores"
          className="text-[var(--primary)] hover:underline"
        >
          ← {copy.title}
        </Link>
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        {copy.editTitle.replace("{name}", store.name)}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {copy.editHint}
      </p>

      <form
        action={async (fd) => {
          "use server";
          await updateStoreAction(store.id, fd);
          redirect("/app/stores");
        }}
        className="mt-8 space-y-3 rounded-[var(--radius)] border border-[var(--border)] p-4"
      >
        <label className="block text-sm">
          {copy.nameLabel}
          <input
            name="name"
            required
            minLength={2}
            defaultValue={store.name}
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          {copy.cityLabel}
          <input
            name="city"
            defaultValue={store.city ?? ""}
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          {copy.addressLabel}
          <input
            name="address"
            defaultValue={store.address ?? ""}
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          {copy.timezoneLabel}
          <input
            name="timezone"
            defaultValue={store.timezone}
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          {copy.contactsLabel}
          <input
            name="contacts"
            defaultValue={store.contacts ?? ""}
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          {copy.webhookLabel}
          <input
            name="webhookUrl"
            defaultValue={store.webhookUrl ?? ""}
            placeholder={copy.webhookPlaceholder}
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          {copy.ntfyLabel}
          <input
            name="ntfyTopic"
            defaultValue={store.ntfyTopic ?? ""}
            placeholder={copy.ntfyPlaceholder}
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
        >
          {copy.save}
        </button>
      </form>
    </main>
  );
}
