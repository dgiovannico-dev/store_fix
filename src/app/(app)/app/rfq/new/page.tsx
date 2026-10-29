import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createQuoteRequestAction } from "@/app/actions/rfq";
import { canMutate } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { listVendors } from "@/domain/vendors/vendor-service";

export default async function NewRfqPage({
  searchParams,
}: {
  searchParams: Promise<{ ticketId?: string }>;
}) {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!canMutate(session.role, RbacAction.manageRfq)) redirect("/app/tickets");

  const sp = await searchParams;
  const vendors = await listVendors(session.tenantId);

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        Nuova RFQ
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Seleziona almeno un fornitore del tenant.
      </p>

      {vendors.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted-foreground)]">
          Nessun fornitore. Crea prima un vendor in anagrafica.
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
            Titolo
            <input
              name="title"
              required
              minLength={2}
              defaultValue={
                sp.ticketId ? `Preventivi ticket ${sp.ticketId.slice(0, 8)}` : ""
              }
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Note
            <textarea
              name="notes"
              rows={3}
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
            />
          </label>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Fornitori</legend>
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
            Apri RFQ
          </button>
        </form>
      )}
    </main>
  );
}
