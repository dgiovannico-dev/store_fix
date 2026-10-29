import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createQuoteRequestAction } from "@/app/actions/rfq";
import { canMutate } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { listVendors } from "@/domain/vendors/vendor-service";
import { tenantMessages } from "@/i18n/tenant-messages";

export default async function NewRfqPage({
  searchParams,
}: {
  searchParams: Promise<{ ticketId?: string }>;
}) {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!canMutate(session.role, RbacAction.manageRfq)) redirect("/app/tickets");

  const sp = await searchParams;
  const msg = await tenantMessages(session.tenantId);
  const vendors = await listVendors(session.tenantId);

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        {msg.rfq.newTitle}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {msg.rfq.newHint}
      </p>

      {vendors.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted-foreground)]">
          {msg.rfq.noVendors}
        </p>
      ) : (
        <form
          action={async (fd) => {
            "use server";
            const result = await createQuoteRequestAction({}, fd);
            if (result.id) redirect(`/app/rfq/${result.id}`);
          }}
          className="mt-8 space-y-4 rounded-[var(--radius)] border border-[var(--border)] p-4"
        >
          {sp.ticketId ? (
            <input type="hidden" name="ticketId" value={sp.ticketId} />
          ) : null}
          <label className="block text-sm">
            {msg.rfq.titleField}
            <input
              name="title"
              required
              minLength={2}
              defaultValue={
                sp.ticketId ? `Ticket ${sp.ticketId.slice(0, 8)}` : ""
              }
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            {msg.rfq.notesField}
            <textarea
              name="notes"
              rows={3}
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
            />
          </label>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{msg.rfq.vendorsField}</legend>
            {vendors.map((v) => (
              <label key={v.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="vendorIds" value={v.id} />
                {v.name}
              </label>
            ))}
          </fieldset>
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
          >
            {msg.rfq.submit}
          </button>
        </form>
      )}
    </main>
  );
}
