import Link from "next/link";
import { Role } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { AttachmentGallery } from "@/components/tickets/attachment-gallery";
import { AttachmentUploader } from "@/components/tickets/attachment-uploader";
import { QuotePanel } from "@/components/tickets/quote-panel";
import { SlaBadge } from "@/components/tickets/sla-badge";
import { TicketDetailTabs } from "@/components/tickets/ticket-detail-tabs";
import { TicketTimeline } from "@/components/tickets/ticket-timeline";
import { VendorTicketActions } from "@/components/vendor/vendor-ticket-actions";
import { getActiveMembership } from "@/application/memberships/membership-service";
import {
  intakeCategoryLabel,
  intakePriorityLabel,
} from "@/domain/intake/chat-steps";
import { computeSlaBadge } from "@/domain/sla/badge";
import { formatMoney } from "@/i18n/format";
import { canProposeQuote } from "@/domain/ticket/quote";
import { ticketStatusLabel } from "@/domain/ticket/status-labels";
import { listTicketEvents } from "@/infrastructure/db/ticket-event-repository";
import { prisma } from "@/infrastructure/db/prisma";
import { tenantMessages } from "@/i18n/tenant-messages";

type Props = { params: Promise<{ id: string }> };

export default async function VendorTicketDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }
  if (session.role !== Role.vendor) redirect("/app/tickets");

  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership?.vendorId) redirect("/login");

  const { id } = await params;
  const ticket = await prisma.ticket.findFirst({
    where: {
      id,
      tenantId: session.tenantId,
      vendorId: membership.vendorId,
      deletedAt: null,
    },
    include: {
      store: true,
      asset: true,
      attachments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!ticket) notFound();

  const [events, msg, prefs] = await Promise.all([
    listTicketEvents(session.tenantId, ticket.id),
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  const copy = msg.ticketDetail;

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

  return (
    <main className="px-4 pb-6 pt-4">
      <div className="sticky top-14 z-20 -mx-4 border-b border-[var(--border)] bg-[var(--background)]/95 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/vendor/inbox"
          className="text-sm text-[var(--muted-foreground)] underline-offset-4 hover:underline"
        >
          {copy.backInbox}
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-sora)] text-xl font-semibold">
          {intakeCategoryLabel(ticket.category, prefs.locale)} ·{" "}
          {intakePriorityLabel(ticket.priority, prefs.locale)}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {ticket.store.name}
          {ticket.store.city ? ` · ${ticket.store.city}` : ""} ·{" "}
          <strong>{ticketStatusLabel(ticket.status, prefs.locale)}</strong>
        </p>
        <div className="mt-2">
          <SlaBadge tone={sla.tone} label={sla.label} />
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
            {ticket.store.address ? (
              <p className="text-sm">{ticket.store.address}</p>
            ) : null}
            <p className="whitespace-pre-wrap">{ticket.description}</p>
            {ticket.asset ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {copy.assetPrefix} {ticket.asset.label}
              </p>
            ) : null}
            {ticket.rejectReason ? (
              <p className="text-sm text-[var(--critical)]">
                {copy.rejectReason} {ticket.rejectReason}
              </p>
            ) : null}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                {copy.photos}
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
              {ticket.status !== "verified" && ticket.status !== "cancelled" ? (
                <AttachmentUploader
                  ticketId={ticket.id}
                  labels={msg.ticketPanels}
                  locale={prefs.locale}
                />
              ) : null}
            </section>
          </>
        }
        work={
          <VendorTicketActions
            ticketId={ticket.id}
            status={ticket.status}
            labels={msg.ticketPanels}
            locale={prefs.locale}
            currency={prefs.currency}
          />
        }
        costs={
          <>
            {ticket.actualCost != null ? (
              <p className="text-sm">
                {copy.costPrefix} {formatMoney(ticket.actualCost, prefs)}
              </p>
            ) : null}
            {canProposeQuote(ticket.status) ? (
              <QuotePanel
                ticketId={ticket.id}
                mode="propose"
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
            ) : ticket.quoteStatus || ticket.estimatedCost ? (
              <QuotePanel
                ticketId={ticket.id}
                mode="readonly"
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
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">—</p>
            )}
          </>
        }
        timeline={
          <TicketTimeline
            events={events}
            labels={msg.ticketTimeline}
            dateLocale={prefs.dateLocale}
            locale={prefs.locale}
            currency={prefs.currency}
          />
        }
      />
    </main>
  );
}
