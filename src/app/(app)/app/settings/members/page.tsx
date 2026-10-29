import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  disableMembershipAction,
  updateMembershipAction,
} from "@/app/actions/memberships";
import { RbacAction } from "@/domain/rbac/actions";
import { can, canMutate } from "@/domain/rbac/can";
import { listMemberships } from "@/domain/memberships/membership-service";
import { roleLabel } from "@/domain/rbac/role-labels";
import { listStores } from "@/domain/stores/store-service";
import { listVendors } from "@/domain/vendors/vendor-service";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { tenantMessages } from "@/i18n/tenant-messages";

export default async function MembersPage() {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");

  const canEdit = canMutate(session.role, RbacAction.membershipStore);
  if (!canEdit) redirect("/onboarding");
  const canAudit = can(session.role, RbacAction.viewConfigAudit);

  const [msg, prefs, members, stores, vendors] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
    listMemberships(session.tenantId),
    listStores(session.tenantId),
    listVendors(session.tenantId),
  ]);
  const copy = msg.members;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {copy.hint}
          </p>
        </div>
        {canAudit ? (
          <Link
            href="/app/settings/audit"
            className="text-sm text-[var(--primary)] underline-offset-4 hover:underline"
          >
            {copy.auditLink}
          </Link>
        ) : null}
      </div>

      <ul className="mt-8 space-y-6">
        {members.map((m) => (
          <li
            key={m.id}
            className="rounded-[var(--radius)] border border-[var(--border)] p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="font-medium">
                  {m.user.name ?? m.user.email}{" "}
                  <span className="text-sm font-normal text-[var(--muted-foreground)]">
                    · {roleLabel(m.role, prefs.locale)}
                    {m.deletedAt ? ` · ${copy.disabled}` : ""}
                  </span>
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {m.user.email}
                </p>
              </div>
              {!m.deletedAt && m.role !== "owner" ? (
                <form
                  action={async () => {
                    "use server";
                    await disableMembershipAction(m.id);
                  }}
                >
                  <button
                    type="submit"
                    className="text-sm text-[var(--critical)] underline-offset-4 hover:underline"
                  >
                    {copy.disable}
                  </button>
                </form>
              ) : null}
            </div>

            {!m.deletedAt ? (
              <form
                className="mt-4 space-y-3"
                action={async (fd) => {
                  "use server";
                  await updateMembershipAction(m.id, fd);
                }}
              >
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">{copy.storeScope}</legend>
                  <div className="flex flex-wrap gap-3">
                    {stores.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="storeIds"
                          value={s.id}
                          defaultChecked={m.storeIds.includes(s.id)}
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {m.role === "vendor" || vendors.length > 0 ? (
                  <label className="block text-sm">
                    {copy.vendorLinked}
                    <select
                      name="vendorId"
                      defaultValue={m.vendorId ?? ""}
                      className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
                    >
                      <option value="">—</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <button
                  type="submit"
                  className="rounded-[var(--radius)] bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-[var(--primary-foreground)]"
                >
                  {copy.saveScope}
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
