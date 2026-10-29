import { Role } from "@prisma/client";
import { createTicket } from "@/application/tickets/create-ticket";
import { parseInboundEmail } from "@/domain/email-inbound/parse-inbound";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

export type InboundEmailPayload = {
  messageId: string;
  subject: string;
  text: string;
  from?: string;
  /** Se assente, si risolve dal primo tenant con store matching hint */
  tenantId?: string;
  tenantSlug?: string;
};

/**
 * Email → ticket (F2-08): dedup Message-ID, resolve store per nome, create come owner HQ.
 * Nessun SaaS inbound: webhook self-host / forwarder OSS.
 */
export async function processInboundEmail(
  payload: InboundEmailPayload,
): Promise<
  | { ok: true; ticketId: string; duplicate?: false }
  | { ok: true; ticketId: string; duplicate: true }
  | { ok: false; message: string; code?: string; params?: Record<string, string> }
> {
  const messageId = payload.messageId.trim();
  if (!messageId) {
    return { ok: false, message: "messageId obbligatorio", code: "messageIdRequired" };
  }

  const parsed = parseInboundEmail({
    subject: payload.subject,
    text: payload.text,
    from: payload.from,
  });
  if (!parsed.storeHint) {
    return {
      ok: false,
      message: "Indica il PV nel subject: [store:Nome] oppure PV: Nome",
      code: "inboundStoreHintRequired",
    };
  }

  let tenantId = payload.tenantId?.trim() || "";
  if (!tenantId && payload.tenantSlug) {
    const t = await prisma.tenant.findUnique({
      where: { slug: payload.tenantSlug.trim() },
    });
    if (!t) return { ok: false, message: "Tenant slug non trovato", code: "tenantSlugNotFound" };
    tenantId = t.id;
  }
  if (!tenantId) {
    return { ok: false, message: "tenantId o tenantSlug obbligatorio", code: "tenantIdOrSlugRequired" };
  }
  requireTenantId(tenantId);

  const existing = await prisma.inboundEmailMessage.findUnique({
    where: {
      tenantId_messageId: { tenantId, messageId },
    },
  });
  if (existing?.ticketId) {
    return { ok: true, ticketId: existing.ticketId, duplicate: true };
  }

  const store = await prisma.store.findFirst({
    where: {
      tenantId,
      deletedAt: null,
      name: { equals: parsed.storeHint, mode: "insensitive" },
    },
  });
  if (!store) {
    return {
      ok: false,
      message: `Punto vendita non trovato: ${parsed.storeHint}`,
      code: "inboundStoreNotFound",
      params: { name: parsed.storeHint },
    };
  }

  const ownerMembership = await prisma.membership.findFirst({
    where: { tenantId, role: Role.owner, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (!ownerMembership) {
    return { ok: false, message: "Nessun owner attivo sul tenant", code: "noActiveOwner" };
  }

  const created = await createTicket({
    tenantId,
    actorUserId: ownerMembership.userId,
    role: Role.owner,
    membership: {
      role: Role.owner,
      storeIds: ownerMembership.storeIds,
      deletedAt: null,
    },
    data: {
      storeId: store.id,
      category: parsed.category,
      priority: parsed.priority,
      description: parsed.description,
    },
  });
  if (!created.ok) {
    return {
      ok: false,
      message: created.message,
      code: created.code,
    };
  }

  await prisma.inboundEmailMessage.upsert({
    where: { tenantId_messageId: { tenantId, messageId } },
    create: {
      tenantId,
      messageId,
      ticketId: created.ticket.id,
      fromAddress: payload.from ?? null,
      subject: parsed.subject.slice(0, 240),
    },
    update: { ticketId: created.ticket.id },
  });

  return { ok: true, ticketId: created.ticket.id };
}
