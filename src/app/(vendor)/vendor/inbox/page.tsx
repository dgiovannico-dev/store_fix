import Link from "next/link";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  listVendorTickets,
  type VendorInboxTab,
} from "@/application/tickets/list-vendor-tickets";
import { SlaBadge } from "@/components/tickets/sla-badge";
import { StatusPanel } from "@/components/ui/status-panel";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import {
  intakeCategoryLabel,
  intakePriorityLabel,
} from "@/domain/intake/chat-steps";
import { computeSlaBadge } from "@/domain/sla/badge";
import { ticketStatusLabel } from "@/domain/ticket/status-labels";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { tenantMessages } from "@/i18n/tenant-messages";

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function VendorInboxPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }
  if (session.role !== Role.vendor) {
    redirect("/app/tickets");
  }
  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership?.vendorId) redirect("/login");

  const [msg, prefs] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  const copy = msg.ticketDetail;
  const tabs: { id: VendorInboxTab; label: string }[] = [
    { id: "todo", label: msg.vendor.tabTodo },
    { id: "progress", label: msg.vendor.tabProgress },
    { id: "closed", label: msg.vendor.tabClosed },
  ];

  const sp = await searchParams;
  const tab: VendorInboxTab =
    sp.tab === "progress" || sp.tab === "closed" ? sp.tab : "todo";

  const tickets = await listVendorTickets({
    tenantId: session.tenantId,
    role: session.role,
    membership,
    tab,
  });

  return (
    <main className="px-4 py-6">
      <h1 className="font-[family-name:var(--font-sora)] text-xl font-semibold text-[var(--primary)]">
        {msg.vendor.inboxTitle}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {msg.vendor.inboxHint}
      </p>

      <nav
        className="sticky top-14 z-10 mt-4 flex gap-1 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm"
        aria-label={msg.vendor.inboxTitle}
      >
        {tabs.map((tabItem) => (
          <Link
            key={tabItem.id}
            href={`/vendor/inbox?tab=${tabItem.id}`}
            className={`flex min-h-11 flex-1 items-center justify-center px-2 text-center text-sm ${
              tab === tabItem.id
                ? "border-b-2 border-[var(--primary)] font-semibold text-[var(--primary)]"
                : "text-[var(--muted-foreground)]"
            }`}
          >
            {tabItem.label}
          </Link>
        ))}
      </nav>

      {tickets.length === 0 ? (
        <div className="mt-4">
          <StatusPanel
            kind="empty"
            locale={prefs.locale}
            title={msg.vendor.emptyInbox}
          />
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-[var(--border)]">
          {tickets.map((tk) => {
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
            return (
              <li key={tk.id}>
                <Link
                  href={`/vendor/tickets/${tk.id}`}
                  className="block min-h-11 py-3 active:bg-[var(--muted)]/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {intakeCategoryLabel(tk.category, prefs.locale)} ·{" "}
                      {intakePriorityLabel(tk.priority, prefs.locale)}
                    </span>
                    <SlaBadge tone={sla.tone} label={sla.label} />
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {tk.store.name} ·{" "}
                    {ticketStatusLabel(tk.status, prefs.locale)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm">{tk.description}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
