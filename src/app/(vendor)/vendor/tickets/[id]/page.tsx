import Link from "next/link";
import { Role } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AttachmentGallery } from "@/components/tickets/attachment-gallery";
import { AttachmentUploader } from "@/components/tickets/attachment-uploader";
import { QuotePanel } from "@/components/tickets/quote-panel";
import { TicketTimeline } from "@/components/tickets/ticket-timeline";
import { VendorTicketActions } from "@/components/vendor/vendor-ticket-actions";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import {
  intakeCategoryLabel,
  intakePriorityLabel,
} from "@/domain/intake/chat-steps";
import { computeSlaBadge } from "@/domain/sla/badge";
import { formatEur } from "@/domain/ticket/costs";
import { canProposeQuote } from "@/domain/ticket/quote";
import { listTicketEvents } from "@/infrastructure/db/ticket-event-repository";
import { prisma } from "@/infrastructure/db/prisma";

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

  const events = await listTicketEvents(session.tenantId, ticket.id);
  const sla = computeSlaBadge({
    slaDueAt: ticket.slaDueAt,
    slaBreachedAt: ticket.slaBreachedAt,
    openedAt: ticket.openedAt,
  });

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[390px] px-4 py-6">
      <Link
        href="/vendor/inbox"
        className="text-sm text-[var(--muted-foreground)] underline-offset-4 hover:underline"
      >
        ← Inbox
      </Link>

      <h1 className="mt-4 font-[family-name:var(--font-sora)] text-xl font-semibold">
        {intakeCategoryLabel(ticket.category)} ·{" "}
        {intakePriorityLabel(ticket.priority)}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {ticket.store.name}
        {ticket.store.city ? ` · ${ticket.store.city}` : ""} ·{" "}
        <strong>{ticket.status}</strong>
      </p>
      {ticket.store.address ? (
        <p className="mt-1 text-sm">{ticket.store.address}</p>
      ) : null}
      <p
        className={`mt-2 text-sm ${
          sla.tone === "breached"
            ? "text-[var(--critical)]"
            : sla.tone === "risk"
              ? "text-amber-700"
              : "text-[var(--muted-foreground)]"
        }`}
      >
        {sla.label}
      </p>
      {ticket.actualCost != null ? (
        <p className="mt-2 text-sm">
          Costo: {formatEur(ticket.actualCost)}
        </p>
      ) : null}

      <p className="mt-6 whitespace-pre-wrap">{ticket.description}</p>
      {ticket.asset ? (
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          Asset: {ticket.asset.label}
        </p>
      ) : null}
      {ticket.rejectReason ? (
        <p className="mt-3 text-sm text-[var(--critical)]">
          Motivo rifiuto store: {ticket.rejectReason}
        </p>
      ) : null}

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Foto
        </h2>
        <AttachmentGallery
          ticketId={ticket.id}
          items={ticket.attachments.map((a) => ({
            id: a.id,
            mime: a.mime,
            sizeBytes: a.sizeBytes,
          }))}
        />
        {ticket.status !== "verified" && ticket.status !== "cancelled" ? (
          <AttachmentUploader ticketId={ticket.id} />
        ) : null}
      </section>

      {canProposeQuote(ticket.status) ? (
        <QuotePanel
          ticketId={ticket.id}
          mode="propose"
          quoteStatus={ticket.quoteStatus}
          estimatedCost={
            ticket.estimatedCost != null ? Number(ticket.estimatedCost) : null
          }
        />
      ) : ticket.quoteStatus || ticket.estimatedCost ? (
        <QuotePanel
          ticketId={ticket.id}
          mode="readonly"
          quoteStatus={ticket.quoteStatus}
          estimatedCost={
            ticket.estimatedCost != null ? Number(ticket.estimatedCost) : null
          }
        />
      ) : null}

      <VendorTicketActions ticketId={ticket.id} status={ticket.status} />

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Timeline
        </h2>
        <TicketTimeline events={events} />
      </section>
    </main>
  );
}
