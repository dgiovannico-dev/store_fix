import { Role, type Membership } from "@prisma/client";
import { z } from "zod";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { assignTicket } from "@/application/tickets/transition-ticket";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCan, ForbiddenError } from "@/domain/rbac/guards";
import { TicketEventType } from "@/domain/ticket/event-types";
import { prisma } from "@/infrastructure/db/prisma";
import { appendTicketEvent } from "@/infrastructure/db/ticket-event-repository";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

export const relaunchSchema = z.object({
  note: z.string().trim().min(3).max(2000),
});

/** Rilancio SLA: nota + re-notify ops (T3.10). */
export async function relaunchSlaTicket(input: {
  tenantId: string;
  ticketId: string;
  actorUserId: string;
  role: Role;
  note: string;
}) {
  requireTenantId(input.tenantId);
  try {
    assertCan(input.role, RbacAction.triageTicket);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false as const, message: e.message, code: e.code };
    }
    throw e;
  }

  const parsed = relaunchSchema.safeParse({ note: input.note });
  if (!parsed.success) {
    return { ok: false as const, message: "Nota rilancio obbligatoria" };
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
    include: { store: true, vendor: true },
  });
  if (!ticket) return { ok: false as const, message: "Ticket non trovato" };
  if (!ticket.slaBreachedAt) {
    return {
      ok: false as const,
      message: "Rilancio solo su ticket in breach",
    };
  }

  await appendTicketEvent({
    tenantId: input.tenantId,
    ticketId: ticket.id,
    actorUserId: input.actorUserId,
    type: TicketEventType.slaRelaunch,
    fromStatus: ticket.status,
    toStatus: ticket.status,
    meta: { note: parsed.data.note },
  });

  // Re-notify con chiave distinta dal breach originale (anti-idempotenza)
  const { enqueueEmail } = await import("@/infrastructure/email/outbox");
  const { resolveHqRecipients } = await import(
    "@/application/notifications/recipients"
  );
  const { NotificationType } = await import("@/domain/notification/types");
  const hq = await resolveHqRecipients(input.tenantId);
  if (hq.length > 0) {
    await prisma.notification.createMany({
      data: hq.map((r) => ({
        tenantId: input.tenantId,
        userId: r.userId,
        type: NotificationType.ticketBreached,
        ticketId: ticket.id,
        payload: {
          relaunch: true,
          note: parsed.data.note,
          actorUserId: input.actorUserId,
        },
      })),
    });
    const stamp = Date.now().toString(36);
    const { locale } = await getTenantI18nPrefs(input.tenantId);
    const relaunchPrefix = locale === "en" ? "SLA relaunch:" : "Rilancio SLA:";
    await Promise.all(
      hq.map((r) =>
        enqueueEmail({
          to: r.email,
          template: "ticket_breach",
          locale,
          vars: {
            ticketId: ticket.id,
            storeName: ticket.store?.name,
            summary: `${relaunchPrefix} ${parsed.data.note}`,
          },
          idempotencyKey: `ticket_breach:relaunch:${ticket.id}:${r.email}:${stamp}`,
        }),
      ),
    );
  }

  return { ok: true as const, ticket };
}

export async function reassignBreachedTicket(input: {
  tenantId: string;
  ticketId: string;
  actorUserId: string;
  role: Role;
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt" | "vendorId">;
  vendorId: string;
  note?: string | null;
}) {
  requireTenantId(input.tenantId);
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!ticket) return { ok: false as const, message: "Ticket non trovato" };
  if (!ticket.slaBreachedAt) {
    return {
      ok: false as const,
      message: "Riassegnazione da breach solo se SLA superato",
    };
  }

  // Deve essere almeno triaged/assigned path — se già assigned, force via assign
  // se status non triaged, triage first handled by ops UI
  if (ticket.status === "open") {
    return {
      ok: false as const,
      message: "Fai triage prima di riassegnare",
    };
  }

  if (ticket.status === "triaged" || ticket.status === "assigned") {
    return assignTicket({
      tenantId: input.tenantId,
      ticketId: input.ticketId,
      actorUserId: input.actorUserId,
      role: input.role,
      vendorId: input.vendorId,
      note: input.note,
    });
  }

  // Altri stati: solo evento + update vendorId
  try {
    assertCan(input.role, RbacAction.triageTicket);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false as const, message: e.message, code: e.code };
    }
    throw e;
  }

  const vendor = await prisma.vendor.findFirst({
    where: {
      id: input.vendorId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!vendor) return { ok: false as const, message: "Fornitore non valido" };

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { vendorId: vendor.id },
    include: { store: true, vendor: true },
  });
  await appendTicketEvent({
    tenantId: input.tenantId,
    ticketId: ticket.id,
    actorUserId: input.actorUserId,
    type: TicketEventType.assigned,
    fromStatus: ticket.status,
    toStatus: ticket.status,
    meta: {
      vendorId: vendor.id,
      vendorName: vendor.name,
      noteInternal: input.note ?? null,
      source: "breach_reassign",
    },
  });
  return { ok: true as const, ticket: updated };
}
