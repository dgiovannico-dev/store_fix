import Link from "next/link";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  listVendorTickets,
  type VendorInboxTab,
} from "@/application/tickets/list-vendor-tickets";
import { StatusPanel } from "@/components/ui/status-panel";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import {
  intakeCategoryLabel,
  intakePriorityLabel,
} from "@/domain/intake/chat-steps";
import { t } from "@/i18n";

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

  const msg = t("it");
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
    <main className="mx-auto min-h-dvh w-full max-w-[390px] px-4 py-6">
      <h1 className="font-[family-name:var(--font-sora)] text-xl font-semibold text-[var(--primary)]">
        {msg.vendor.inboxTitle}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {msg.vendor.inboxHint}
      </p>

      <nav className="mt-6 flex gap-1 border-b border-[var(--border)]" aria-label="Filtri inbox">
        {tabs.map((tabItem) => (
          <Link
            key={tabItem.id}
            href={`/vendor/inbox?tab=${tabItem.id}`}
            className={`flex-1 px-2 py-2 text-center text-sm ${
              tab === tabItem.id
                ? "border-b-2 border-[var(--primary)] font-semibold"
                : "text-[var(--muted-foreground)]"
            }`}
          >
            {tabItem.label}
          </Link>
        ))}
      </nav>

      {tickets.length === 0 ? (
        <div className="mt-4">
          <StatusPanel kind="empty" title={msg.vendor.emptyInbox} />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--border)]">
          {tickets.map((tk) => (
            <li key={tk.id} className="py-4">
              <Link
                href={`/vendor/tickets/${tk.id}`}
                className="block font-medium underline-offset-4 hover:underline"
              >
                {intakeCategoryLabel(tk.category)} ·{" "}
                {intakePriorityLabel(tk.priority)}
              </Link>
              <p className="text-sm text-[var(--muted-foreground)]">
                {tk.store.name} · {tk.status}
                {tk.slaDueAt
                  ? ` · SLA ${tk.slaDueAt.toLocaleString("it-IT")}`
                  : ""}
              </p>
              <p className="mt-1 line-clamp-2 text-sm">{tk.description}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
