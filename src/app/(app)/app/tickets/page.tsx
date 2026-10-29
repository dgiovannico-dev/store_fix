import Link from "next/link";
import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  listTicketsForMembership,
  type TicketListFilters,
} from "@/application/tickets/list-tickets";
import { StatusPanel } from "@/components/ui/status-panel";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import {
  intakeCategoryLabel,
  intakePriorityLabel,
} from "@/domain/intake/chat-steps";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { tenantMessages } from "@/i18n/tenant-messages";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

type Props = {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    storeId?: string;
    vendorId?: string;
    slaRisk?: string;
  }>;
};

const HQ = new Set<Role>([
  Role.owner,
  Role.admin_hq,
  Role.ops_coordinator,
  Role.viewer_finance,
]);

export default async function TicketsListPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }
  requireTenantId(session.tenantId);
  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership) redirect("/login");

  const sp = await searchParams;
  const filters: TicketListFilters = {
    status: isStatus(sp.status) ? sp.status : "",
    priority: isPriority(sp.priority) ? sp.priority : "",
    storeId: sp.storeId || "",
    vendorId: sp.vendorId || "",
    slaRisk:
      sp.slaRisk === "overdue" || sp.slaRisk === "due_soon" ? sp.slaRisk : "",
  };

  const started = performance.now();
  const visible = await listTicketsForMembership({
    tenantId: session.tenantId,
    role: session.role,
    membership,
    filters,
  });
  const listMs = Math.round(performance.now() - started);

  const isHq = HQ.has(session.role);
  const canOpen = can(session.role, RbacAction.openTicket);
  const [msg, prefs] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  const locale = prefs.locale;
  const [stores, vendors] = isHq
    ? await Promise.all([
        prisma.store.findMany({
          where: { tenantId: session.tenantId, deletedAt: null },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.vendor.findMany({
          where: { tenantId: session.tenantId, deletedAt: null },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
      ])
    : [[], []];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {msg.nav.tickets}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {msg.ticketsList.scopeHint} · query {listMs} ms
          </p>
        </div>
        {canOpen ? (
          <Link
            href="/app/tickets/new"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
          >
            {msg.dashboard.ctaTicket}
          </Link>
        ) : null}
      </div>

      {isHq ? (
        <form className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" method="get">
          <FilterSelect
            name="status"
            label="Stato"
            value={filters.status ?? ""}
            options={Object.values(TicketStatus).map((s) => ({
              value: s,
              label: s,
            }))}
          />
          <FilterSelect
            name="priority"
            label="Priorità"
            value={filters.priority ?? ""}
            options={Object.values(TicketPriority).map((p) => ({
              value: p,
              label: intakePriorityLabel(p, locale),
            }))}
          />
          <FilterSelect
            name="storeId"
            label="Store"
            value={filters.storeId ?? ""}
            options={stores.map((s) => ({ value: s.id, label: s.name }))}
          />
          <FilterSelect
            name="vendorId"
            label="Vendor"
            value={filters.vendorId ?? ""}
            options={vendors.map((v) => ({ value: v.id, label: v.name }))}
          />
          <FilterSelect
            name="slaRisk"
            label="SLA"
            value={filters.slaRisk ?? ""}
            options={[
              { value: "overdue", label: msg.ticketsList.slaOverdue },
              { value: "due_soon", label: msg.ticketsList.slaDueSoon },
            ]}
          />
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-2 text-sm"
            >
              {msg.ticketsList.filter}
            </button>
            <Link
              href="/app/tickets"
              className="px-2 py-2 text-sm text-[var(--muted-foreground)] underline-offset-4 hover:underline"
            >
              {msg.ticketsList.reset}
            </Link>
          </div>
        </form>
      ) : null}

      {visible.length === 0 ? (
        <div className="mt-8">
          <StatusPanel
            kind="empty"
            title={msg.common.empty}
            body={
              canOpen
                ? msg.ticketsList.emptyOpenBody
                : msg.ticketsList.emptyClosedBody
            }
          >
            {canOpen ? (
              <Link
                href="/app/tickets/new"
                className="text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
              >
                {msg.dashboard.ctaTicket}
              </Link>
            ) : null}
          </StatusPanel>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-[var(--border)]">
          {visible.map((tk) => (
            <li key={tk.id} className="py-4">
              <Link
                href={`/app/tickets/${tk.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {intakeCategoryLabel(tk.category, locale)} ·{" "}
                {intakePriorityLabel(tk.priority, locale)}
              </Link>
              <p className="text-sm text-[var(--muted-foreground)]">
                {tk.store.name} · {tk.status}
                {tk.vendor ? ` · ${tk.vendor.name}` : ""} ·{" "}
                {tk.slaDueAt
                  ? `SLA ${tk.slaDueAt.toLocaleString("it-IT")}`
                  : "SLA —"}
              </p>
              <p className="mt-1 line-clamp-2 text-sm">{tk.description}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function FilterSelect(props: {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{props.label}</span>
      <select
        name={props.name}
        defaultValue={props.value}
        className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm"
      >
        <option value="">Tutti</option>
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function isStatus(v: string | undefined): v is TicketStatus {
  return !!v && Object.values(TicketStatus).includes(v as TicketStatus);
}

function isPriority(v: string | undefined): v is TicketPriority {
  return !!v && Object.values(TicketPriority).includes(v as TicketPriority);
}
