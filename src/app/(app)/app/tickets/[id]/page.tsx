import Link from "next/link";
import { Role } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { preferredVendorHint } from "@/application/tickets/transition-ticket";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { PageFrame } from "@/components/layout/page-frame";
import { TicketOpsPanel } from "@/components/ops/ticket-ops-panel";
import { SlaRelaunchPanel } from "@/components/ops/sla-relaunch-panel";
import { AttachmentGallery } from "@/components/tickets/attachment-gallery";
import { AttachmentUploader } from "@/components/tickets/attachment-uploader";
import { QuotePanel } from "@/components/tickets/quote-panel";
import { SlaBadge } from "@/components/tickets/sla-badge";
import { SummarizeNotesPanel } from "@/components/tickets/summarize-notes-panel";
import { TicketDetailTabs } from "@/components/tickets/ticket-detail-tabs";
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
import { ticketStatusLabel } from "@/domain/ticket/status-labels";
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
    <PageFrame>
      <div className="sticky top-14 z-20 -mx-4 border-b border-[var(--border)] bg-[var(--background)]/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {sp.created === "1" ? (
          <p
            className="mb-2 rounded-[var(--radius)] border border-[var(--success)] px-3 py-2 text-sm text-[var(--success)]"
            role="status"
          >
            {copy.createdBanner} <code className="text-xs">{ticket.id}</code>
          </p>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-sora)] text-xl font-semibold sm:text-2xl">
              {intakeCategoryLabel(ticket.category, prefs.locale)} ·{" "}
              {intakePriorityLabel(ticket.priority, prefs.locale)}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {ticket.store.name} · {copy.statusPrefix}{" "}
              <strong>{ticketStatusLabel(ticket.status, prefs.locale)}</strong>
              {ticket.vendor ? ` · ${ticket.vendor.name}` : ""}
            </p>
            <div className="mt-2">
              <SlaBadge tone={sla.tone} label={sla.label} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canOps ? (
              <Link
                href={`/app/rfq/new?ticketId=${ticket.id}`}
                className="inline-flex h-10 items-center rounded-[var(--radius)] border border-[var(--border)] px-3 text-sm font-medium"
              >
                {copy.rfqLink}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <TicketDetailTabs
        labels={{
          overview: copy.tabOverview,
          work: copy.tabWork,
          costs: copy.tabCosts,
          timeline: copy.tabTimeline,
        }}
        overview={
          <>
            <p className="whitespace-pre-wrap text-[var(--foreground)]">
              {ticket.description}
            </p>
            {ticket.asset ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {copy.assetPrefix} {ticket.asset.label}
              </p>
            ) : null}
            {ticket.cancelReason ? (
              <p className="text-sm text-[var(--critical)]">
                {copy.cancelReason} {ticket.cancelReason}
              </p>
            ) : null}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                {copy.attachments}
              </h2>
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
            </section>
            <SummarizeNotesPanel
              ticketId={ticket.id}
              canOps={canOps}
              labels={msg.ticketPanels}
              locale={prefs.locale}
            />
          </>
        }
        work={
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
            <SlaRelaunchPanel
              ticketId={ticket.id}
              breached={!!ticket.slaBreachedAt}
              canOps={canOps}
              labels={msg.ticketPanels}
              locale={prefs.locale}
            />
            <VerifyPanel
              ticketId={ticket.id}
              status={ticket.status}
              canVerify={can(session.role, RbacAction.verifyTicket)}
              labels={msg.ticketPanels}
              locale={prefs.locale}
            />
            {ticket.completionReport ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {copy.reportPrefix} {ticket.completionReport}
              </p>
            ) : null}
          </>
        }
        costs={
          <>
            {showCosts ? (
              <p className="text-sm">
                {copy.costsPrefix}{" "}
                {formatMoney(ticket.actualCost, prefs) ?? copy.actualDash}
                {ticket.estimatedCost
                  ? ` · ${copy.estimatePrefix} ${formatMoney(ticket.estimatedCost, prefs)}`
                  : ""}
              </p>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">—</p>
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
          </>
        }
        timeline={
          <TicketTimeline
            events={events}
            showInternalNotes={showInternalNotes}
            labels={msg.ticketTimeline}
            dateLocale={prefs.dateLocale}
            locale={prefs.locale}
            currency={prefs.currency}
          />
        }
      />
    </PageFrame>
  );
}
