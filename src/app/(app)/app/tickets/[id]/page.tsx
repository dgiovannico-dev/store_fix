import Link from "next/link";
import { Role } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { preferredVendorHint } from "@/application/tickets/transition-ticket";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { TicketOpsPanel } from "@/components/ops/ticket-ops-panel";
import { SlaRelaunchPanel } from "@/components/ops/sla-relaunch-panel";
import { AttachmentGallery } from "@/components/tickets/attachment-gallery";
import { AttachmentUploader } from "@/components/tickets/attachment-uploader";
import { QuotePanel } from "@/components/tickets/quote-panel";
import { SummarizeNotesPanel } from "@/components/tickets/summarize-notes-panel";
import { TicketTimeline } from "@/components/tickets/ticket-timeline";
import { VerifyPanel } from "@/components/tickets/verify-panel";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { canAccessStore } from "@/domain/rbac/store-scope";
import {
  intakeCategoryLabel,
  intakePriorityLabel,
} from "@/domain/intake/chat-steps";
import { computeSlaBadge } from "@/domain/sla/badge";
import { canReadTicketCosts } from "@/domain/ticket/costs";
import { formatMoney } from "@/i18n/format";
import { canDecideQuote } from "@/domain/ticket/quote";
import { listTicketEvents } from "@/infrastructure/db/ticket-event-repository";
import { prisma } from "@/infrastructure/db/prisma";
import { tenantMessages } from "@/i18n/tenant-messages";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

const HQ_OPS = new Set<Role>([
  Role.owner,
  Role.admin_hq,
  Role.ops_coordinator,
]);

export default async function TicketDetailPage({
  params,
  searchParams,
}: Props) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }
  const { id } = await params;
  const sp = await searchParams;

  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership) redirect("/login");

  const ticket = await prisma.ticket.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    include: {
      store: true,
      asset: { include: { preferredVendor: true } },
      vendor: true,
      attachments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!ticket) notFound();
  if (!canAccessStore(membership, ticket.storeId)) notFound();

  const [events, msg, prefs] = await Promise.all([
    listTicketEvents(session.tenantId, ticket.id),
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  const copy = msg.ticketDetail;
  const canOps = HQ_OPS.has(session.role);
  const showInternalNotes = can(session.role, RbacAction.triageTicket);

  const vendors = canOps
    ? await prisma.vendor.findMany({
        where: { tenantId: session.tenantId, deletedAt: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : [];

  const hint = preferredVendorHint(ticket.asset);
  const sla = computeSlaBadge({
    slaDueAt: ticket.slaDueAt,
    slaBreachedAt: ticket.slaBreachedAt,
    openedAt: ticket.openedAt,
    dateLocale: prefs.dateLocale,
    labels: {
      breached: copy.slaBreached,
      none: copy.slaNone,
      riskPrefix: copy.slaRiskPrefix,
      okPrefix: copy.slaOkPrefix,
    },
  });
  const showCosts = canReadTicketCosts(session.role, ticket.status);
  const canDecide =
    can(session.role, RbacAction.acceptQuote) &&
    canDecideQuote(ticket.status, ticket.quoteStatus);

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link
        href="/app/tickets"
        className="text-sm text-[var(--muted-foreground)] underline-offset-4 hover:underline"
      >
        {copy.back}
      </Link>

      {sp.created === "1" ? (
        <p
          className="mt-4 rounded-[var(--radius)] border border-[var(--success)] px-3 py-2 text-sm text-[var(--success)]"
          role="status"
        >
          {copy.createdBanner} <code className="text-xs">{ticket.id}</code>
        </p>
      ) : null}

      <h1 className="mt-4 font-[family-name:var(--font-sora)] text-2xl font-semibold">
        {intakeCategoryLabel(ticket.category, prefs.locale)} ·{" "}
        {intakePriorityLabel(ticket.priority, prefs.locale)}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {ticket.store.name} · {copy.statusPrefix}{" "}
        <strong>{ticket.status}</strong>
        {ticket.vendor ? ` · ${ticket.vendor.name}` : ""}
      </p>
      <p
        className={`mt-1 text-sm ${
          sla.tone === "breached"
            ? "text-[var(--critical)]"
            : sla.tone === "risk"
              ? "text-amber-700"
              : "text-[var(--muted-foreground)]"
        }`}
      >
        {sla.label}
      </p>

      <p className="mt-6 whitespace-pre-wrap text-[var(--foreground)]">
        {ticket.description}
      </p>

      {ticket.asset ? (
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">
          {copy.assetPrefix} {ticket.asset.label}
        </p>
      ) : null}

      {showCosts ? (
        <p className="mt-4 text-sm">
          {copy.costsPrefix}{" "}
          {formatMoney(ticket.actualCost, prefs) ?? copy.actualDash}
          {ticket.estimatedCost
            ? ` · ${copy.estimatePrefix} ${formatMoney(ticket.estimatedCost, prefs)}`
            : ""}
        </p>
      ) : null}

      {(canDecide || ticket.quoteStatus || ticket.estimatedCost) &&
      (canDecide || showCosts) ? (
        <QuotePanel
          ticketId={ticket.id}
          mode={canDecide ? "decide" : "readonly"}
          quoteStatus={ticket.quoteStatus}
          estimatedCost={
            ticket.estimatedCost != null ? Number(ticket.estimatedCost) : null
          }
          labels={msg.ticketPanels}
          dateLocale={prefs.dateLocale}
          currency={prefs.currency}
        />
      ) : null}

      {ticket.completionReport ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {copy.reportPrefix} {ticket.completionReport}
        </p>
      ) : null}

      {ticket.cancelReason ? (
        <p className="mt-4 text-sm text-[var(--critical)]">
          {copy.cancelReason} {ticket.cancelReason}
        </p>
      ) : null}

      <section className="mt-10 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {copy.attachments}
        </h2>
        <AttachmentGallery
          ticketId={ticket.id}
          labels={msg.ticketPanels}
          photoWord={copy.photos}
          items={ticket.attachments.map((a) => ({
            id: a.id,
            mime: a.mime,
            sizeBytes: a.sizeBytes,
          }))}
        />
        {ticket.status !== "cancelled" && ticket.status !== "verified" ? (
          <AttachmentUploader
            ticketId={ticket.id}
            labels={msg.ticketPanels}
          />
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {copy.timeline}
        </h2>
        <TicketTimeline
          events={events}
          showInternalNotes={showInternalNotes}
          labels={msg.ticketTimeline}
          dateLocale={prefs.dateLocale}
        />
      </section>

      <SummarizeNotesPanel
        ticketId={ticket.id}
        canOps={canOps}
        labels={msg.ticketPanels}
      />

      {canOps ? (
        <p className="mt-4 text-sm">
          <Link
            href={`/app/rfq/new?ticketId=${ticket.id}`}
            className="font-medium text-[var(--primary)] hover:underline"
          >
            {copy.rfqLink}
          </Link>
        </p>
      ) : null}

      <TicketOpsPanel
        ticketId={ticket.id}
        status={ticket.status}
        priority={ticket.priority}
        storeId={ticket.storeId}
        category={ticket.category}
        vendors={vendors}
        preferredHint={hint}
        canOps={canOps}
        labels={msg.ticketPanels}
        locale={prefs.locale}
      />

      <SlaRelaunchPanel
        ticketId={ticket.id}
        breached={!!ticket.slaBreachedAt}
        canOps={canOps}
        labels={msg.ticketPanels}
      />

      <VerifyPanel
        ticketId={ticket.id}
        status={ticket.status}
        canVerify={can(session.role, RbacAction.verifyTicket)}
        labels={msg.ticketPanels}
      />
    </main>
  );
}
