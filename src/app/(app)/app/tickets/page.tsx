import Link from "next/link";
import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  listTicketsForMembership,
  type TicketListFilters,
} from "@/application/tickets/list-tickets";
import { PageFrame } from "@/components/layout/page-frame";
import { SlaBadge } from "@/components/tickets/sla-badge";
import { Button } from "@/components/ui/button";
import { StatusPanel } from "@/components/ui/status-panel";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import {
  intakeCategoryLabel,
  intakePriorityLabel,
} from "@/domain/intake/chat-steps";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { computeSlaBadge } from "@/domain/sla/badge";
import { ticketStatusLabel } from "@/domain/ticket/status-labels";
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

  const visible = await listTicketsForMembership({
    tenantId: session.tenantId,
    role: session.role,
    membership,
    filters,
  });

  const isHq = HQ.has(session.role);
  const canOpen = can(session.role, RbacAction.openTicket);
  const [msg, prefs] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  const copy = msg.ticketDetail;
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
    <PageFrame>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {msg.nav.tickets}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {msg.ticketsList.scopeHint}
          </p>
        </div>
        {canOpen ? (
          <Button asChild>
            <Link href="/app/tickets/new">{msg.dashboard.ctaTicket}</Link>
          </Button>
        ) : null}
      </div>

      {isHq ? (
        <form
          className="sticky top-0 z-10 mt-6 grid gap-3 border-b border-[var(--border)] bg-[var(--background)]/95 py-3 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
          method="get"
        >
          <FilterSelect
            name="status"
            label={msg.ticketsList.filterStatus}
            allLabel={msg.common.filterAll}
            value={filters.status ?? ""}
            options={Object.values(TicketStatus).map((s) => ({
              value: s,
              label: ticketStatusLabel(s, prefs.locale),
            }))}
          />
          <FilterSelect
            name="priority"
            label={msg.ticketsList.filterPriority}
            allLabel={msg.common.filterAll}
            value={filters.priority ?? ""}
            options={Object.values(TicketPriority).map((p) => ({
              value: p,
              label: intakePriorityLabel(p, prefs.locale),
            }))}
          />
          <FilterSelect
            name="storeId"
            label={msg.ticketsList.filterStore}
            allLabel={msg.common.filterAll}
            value={filters.storeId ?? ""}
            options={stores.map((s) => ({ value: s.id, label: s.name }))}
          />
          <FilterSelect
            name="vendorId"
            label={msg.ticketsList.filterVendor}
            allLabel={msg.common.filterAll}
            value={filters.vendorId ?? ""}
            options={vendors.map((v) => ({ value: v.id, label: v.name }))}
          />
          <FilterSelect
            name="slaRisk"
            label={msg.ticketsList.filterSla}
            allLabel={msg.common.filterAll}
            value={filters.slaRisk ?? ""}
            options={[
              { value: "overdue", label: msg.ticketsList.slaOverdue },
              { value: "due_soon", label: msg.ticketsList.slaDueSoon },
            ]}
          />
          <div className="flex items-end gap-2">
            <Button type="submit" variant="outline" size="sm">
              {msg.ticketsList.filter}
            </Button>
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
            locale={prefs.locale}
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
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[length:var(--text-caption)] uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="py-2 pr-3 font-medium">
                  {msg.ticketsList.colId}
                </th>
                <th className="py-2 pr-3 font-medium">
                  {msg.ticketsList.colStore}
                </th>
                <th className="py-2 pr-3 font-medium">
                  {msg.ticketsList.colStatus}
                </th>
                <th className="py-2 pr-3 font-medium">
                  {msg.ticketsList.colPriority}
                </th>
                <th className="py-2 pr-3 font-medium">
                  {msg.ticketsList.colSla}
                </th>
                <th className="py-2 font-medium">
                  {msg.ticketsList.colVendor}
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((tk) => {
                const sla = computeSlaBadge({
                  slaDueAt: tk.slaDueAt,
                  slaBreachedAt: tk.slaBreachedAt,
                  openedAt: tk.openedAt,
                  dateLocale: prefs.dateLocale,
                  labels: {
                    breached: copy.slaBreached,
                    none: copy.slaNone,
                    riskPrefix: copy.slaRiskPrefix,
                    okPrefix: copy.slaOkPrefix,
                  },
                });
                const shortId = tk.id.slice(0, 8);
                return (
                  <tr
                    key={tk.id}
                    className="border-b border-[var(--border)]/70 hover:bg-[var(--muted)]/40"
                  >
                    <td className="py-2.5 pr-3">
                      <Link
                        href={`/app/tickets/${tk.id}`}
                        className="font-medium text-[var(--primary)] underline-offset-2 hover:underline"
                        title={intakeCategoryLabel(tk.category, prefs.locale)}
                      >
                        <code className="text-xs">{shortId}</code>
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3">{tk.store.name}</td>
                    <td className="py-2.5 pr-3">
                      {ticketStatusLabel(tk.status, prefs.locale)}
                    </td>
                    <td className="py-2.5 pr-3">
                      {intakePriorityLabel(tk.priority, prefs.locale)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <SlaBadge tone={sla.tone} label={sla.label} />
                    </td>
                    <td className="py-2.5 text-[var(--muted-foreground)]">
                      {tk.vendor?.name ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageFrame>
  );
}

function FilterSelect(props: {
  name: string;
  label: string;
  allLabel: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-sm">
      <span className="text-[length:var(--text-caption)] font-medium text-[var(--muted-foreground)]">
        {props.label}
      </span>
      <select
        name={props.name}
        defaultValue={props.value}
        className="mt-1 h-9 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-2 text-sm"
      >
        <option value="">{props.allLabel}</option>
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
