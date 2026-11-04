import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createQuoteRequestAction } from "@/app/actions/rfq";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { PageFrame } from "@/components/layout/page-frame";
import { MultiCheckPicker } from "@/components/ui/multi-check-picker";
import { StatusPanel } from "@/components/ui/status-panel";
import { canMutate } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { listVendors } from "@/application/vendors/vendor-service";
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
  const [msg, prefs] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  const vendors = await listVendors(session.tenantId);

  return (
    <PageFrame>
      <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        {msg.rfq.newTitle}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {msg.rfq.newHint}
      </p>

      {vendors.length === 0 ? (
        <div className="mt-6">
          <StatusPanel
            kind="empty"
            title={msg.rfq.noVendors}
            locale={prefs.locale}
          />
        </div>
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
                sp.ticketId
                  ? msg.rfq.defaultTitleFromTicket.replace(
                      "{shortId}",
                      sp.ticketId.slice(0, 8),
                    )
                  : ""
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
          <MultiCheckPicker
            name="vendorIds"
            legend={msg.rfq.vendorsField}
            options={vendors.map((v) => ({ id: v.id, label: v.name }))}
            searchPlaceholder={msg.common.searchList}
            selectedCountLabel={msg.common.selectedCount}
            selectAllLabel={msg.common.selectAllFiltered}
            clearLabel={msg.common.clearSelection}
          />
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
          >
            {msg.rfq.submit}
          </button>
        </form>
      )}
    </PageFrame>
  );
}
