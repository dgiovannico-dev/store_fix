import { Role } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { preferredVendorHint } from "@/application/tickets/transition-ticket";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { PageFrame } from "@/components/layout/page-frame";
import { TicketOpsPanel } from "@/components/ops/ticket-ops-panel";
import { BreachBriefPanel } from "@/components/ops/breach-brief-panel";
import { BreachPlaybookPanel } from "@/components/ops/breach-playbook-panel";
import { SlaRelaunchPanel } from "@/components/ops/sla-relaunch-panel";
import { TicketInvitePanel } from "@/components/tickets/ticket-invite-panel";
import { AttachmentGallery } from "@/components/tickets/attachment-gallery";
import { AttachmentUploader } from "@/components/tickets/attachment-uploader";
import { QuotePanel } from "@/components/tickets/quote-panel";
import { SimilarTicketsPanel } from "@/components/tickets/similar-tickets-panel";
import { SummarizeNotesPanel } from "@/components/tickets/summarize-notes-panel";
import { TicketDetailHero } from "@/components/tickets/ticket-detail-hero";
import { TicketDetailTabs } from "@/components/tickets/ticket-detail-tabs";
import { TicketPanelSection } from "@/components/tickets/ticket-panel-section";
import { TicketTimeline } from "@/components/tickets/ticket-timeline";
import { VerifyPanel } from "@/components/tickets/verify-panel";
import { getActiveMembership } from "@/application/memberships/membership-service";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { canAccessStore } from "@/domain/rbac/store-scope";
import {
  intakeCategoryLabel,
  intakePriorityLabel,
} from "@/domain/intake/chat-steps";
import { computeSlaBadge } from "@/domain/sla/badge";
import { canReadTicketCosts } from "@/domain/ticket/costs";
import { ticketStatusLabel } from "@/domain/ticket/status-labels";
import { formatMoney } from "@/i18n/format";
import { canDecideQuote } from "@/domain/ticket/quote";
import { listTicketEvents } from "@/infrastructure/db/ticket-event-repository";
import { prisma } from "@/infrastructure/db/prisma";
import { tenantMessages } from "@/i18n/tenant-messages";
import { safeAppReturnPath } from "@/lib/safe-return-path";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; returnTo?: string }>;
};

const HQ_OPS = new Set<Role>([
  Role.owner,
  Role.admin_hq,
  Role.ops_coordinator,
]);

function leadFromDescription(text: string, max = 220): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function titleFromDescription(text: string, fallback: string): string {
  const first = text
    .split(/\n+/)
    .map((l) => l.trim())
    .find((l) => l.length >= 8);
  if (!first) return fallback;
  return first.length > 96 ? `${first.slice(0, 93).trimEnd()}…` : first;
}

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
  const canVerify = can(session.role, RbacAction.verifyTicket);

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

  const returnTo = sp.returnTo
    ? safeAppReturnPath(sp.returnTo, "/app/tickets")
    : null;
  const backHref = returnTo ?? "/app/tickets";
  // Same back button chrome for tickets list, wallboard, or other safe returnTo.
  const backLabel = copy.back;

  const categoryLabel = intakeCategoryLabel(ticket.category, prefs.locale);
  const priorityLabel = intakePriorityLabel(ticket.priority, prefs.locale);
  const statusLabel = ticketStatusLabel(ticket.status, prefs.locale);
  const heroTitle = titleFromDescription(
    ticket.description,
    `${categoryLabel} · ${priorityLabel}`,
  );

  const intakeBlock = (
    <TicketPanelSection title={copy.sectionIntake}>
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--foreground)]">
        {ticket.description}
      </p>
    </TicketPanelSection>
  );

  const attachmentsBlock = (
    <TicketPanelSection title={copy.attachments}>
      <AttachmentGallery
        ticketId={ticket.id}
        labels={msg.ticketPanels}
        photoWord={copy.photos}
        locale={prefs.locale}
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
          locale={prefs.locale}
        />
      ) : null}
    </TicketPanelSection>
  );

  const actionsInner = (
    <>
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
      <BreachPlaybookPanel
        ticketId={ticket.id}
        breached={!!ticket.slaBreachedAt}
        canOps={canOps}
        labels={msg.ticketPanels}
      />
      <SlaRelaunchPanel
        ticketId={ticket.id}
        breached={!!ticket.slaBreachedAt}
        canOps={canOps}
        labels={msg.ticketPanels}
        locale={prefs.locale}
      />
      <BreachBriefPanel
        ticketId={ticket.id}
        breached={!!ticket.slaBreachedAt}
        canOps={canOps}
        labels={msg.ticketPanels}
      />
      <TicketInvitePanel
        canInvite={canOps && can(session.role, RbacAction.inviteUsers)}
        storeId={ticket.storeId}
        vendorId={ticket.vendorId}
        labels={msg.ticketPanels}
        locale={prefs.locale}
      />
      <VerifyPanel
        ticketId={ticket.id}
        status={ticket.status}
        canVerify={canVerify}
        labels={msg.ticketPanels}
        locale={prefs.locale}
      />
      {ticket.completionReport ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          {copy.reportPrefix} {ticket.completionReport}
        </p>
      ) : null}
      {!canOps && !(canVerify && ticket.status === "done") ? (
        <p className="text-sm text-[var(--muted-foreground)]">{copy.workEmpty}</p>
      ) : null}
    </>
  );

  const actionsBlock = (
    <TicketPanelSection
      title={copy.sectionActions}
      tone={
        canVerify && ticket.status === "done" ? "emphasize" : "default"
      }
    >
      {actionsInner}
    </TicketPanelSection>
  );

  const assistBlock = canOps ? (
    <TicketPanelSection title={copy.sectionAssist}>
      <div className="space-y-6">
        <SummarizeNotesPanel
          ticketId={ticket.id}
          canOps={canOps}
          labels={msg.ticketPanels}
          locale={prefs.locale}
        />
        <SimilarTicketsPanel
          ticketId={ticket.id}
          canOps={canOps}
          labels={msg.ticketPanels}
        />
      </div>
    </TicketPanelSection>
  ) : null;

  const costsBlock = (
    <TicketPanelSection title={copy.sectionCosts}>
      {showCosts ? (
        <p className="text-sm">
          <span className="text-[var(--muted-foreground)]">
            {copy.costsPrefix}{" "}
          </span>
          <span className="font-medium tabular">
            {formatMoney(ticket.actualCost, prefs) ?? copy.actualDash}
          </span>
          {ticket.estimatedCost ? (
            <span className="text-[var(--muted-foreground)]">
              {" "}
              · {copy.estimatePrefix}{" "}
              {formatMoney(ticket.estimatedCost, prefs)}
            </span>
          ) : null}
        </p>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          {copy.costsEmpty}
        </p>
      )}
      {(canDecide || ticket.quoteStatus || ticket.estimatedCost) &&
      (canDecide || showCosts) ? (
        <QuotePanel
          ticketId={ticket.id}
          mode={canDecide ? "decide" : "readonly"}
          quoteStatus={ticket.quoteStatus}
          estimatedCost={
            ticket.estimatedCost != null
              ? Number(ticket.estimatedCost)
              : null
          }
          labels={msg.ticketPanels}
          locale={prefs.locale}
          dateLocale={prefs.dateLocale}
          currency={prefs.currency}
        />
      ) : null}
    </TicketPanelSection>
  );

  const timelineBlock = (
    <TicketPanelSection title={copy.tabTimeline}>
      <TicketTimeline
        events={events}
        showInternalNotes={showInternalNotes}
        labels={msg.ticketTimeline}
        dateLocale={prefs.dateLocale}
        locale={prefs.locale}
        currency={prefs.currency}
      />
    </TicketPanelSection>
  );

  return (
    <PageFrame className="max-w-6xl">
      <TicketDetailHero
        backHref={backHref}
        backLabel={backLabel}
        createdBanner={sp.created === "1" ? copy.createdBanner : null}
        title={heroTitle}
        descriptionLead={leadFromDescription(ticket.description)}
        categoryLabel={categoryLabel}
        priorityLabel={priorityLabel}
        statusLabel={statusLabel}
        storeName={ticket.store.name}
        storeLabel={copy.storeLabel}
        vendorName={ticket.vendor?.name}
        vendorLabel={copy.vendorLabel}
        assetLabel={ticket.asset?.label}
        assetPrefix={copy.assetPrefix}
        ticketId={ticket.id}
        ticketIdLabel={copy.ticketIdLabel}
        slaTone={sla.tone}
        slaLabel={sla.label}
        rfqHref={canOps ? `/app/rfq/new?ticketId=${ticket.id}` : null}
        rfqLabel={canOps ? copy.rfqLink : null}
        cancelReason={ticket.cancelReason}
        cancelReasonLabel={copy.cancelReason}
        rejectReason={ticket.rejectReason}
        rejectReasonLabel={copy.rejectReason}
      />

      <TicketDetailTabs
        labels={{
          overview: copy.tabOverview,
          work: copy.tabWork,
          costs: copy.tabCosts,
          timeline: copy.tabTimeline,
        }}
        desktopSplit={{
          main: (
            <>
              {intakeBlock}
              {attachmentsBlock}
              {assistBlock}
            </>
          ),
          aside: actionsBlock,
        }}
        overview={
          <>
            {intakeBlock}
            {attachmentsBlock}
            {assistBlock}
          </>
        }
        work={actionsBlock}
        costs={costsBlock}
        timeline={timelineBlock}
      />
    </PageFrame>
  );
}
