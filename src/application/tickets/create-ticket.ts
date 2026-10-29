import {
  Role,
  TicketPriority,
  TicketStatus,
  type Membership,
} from "@prisma/client";
import { z } from "zod";
import { INTAKE_CATEGORY_VALUES } from "@/domain/intake/chat-steps";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCan, ForbiddenError } from "@/domain/rbac/guards";
import { canAccessStore } from "@/domain/rbac/store-scope";
import { computeSlaDueAt } from "@/domain/sla/compute-due-at";
import { statusTimestampData } from "@/domain/ticket/status-timestamps";
import { emitTicketNotification } from "@/application/notifications/emit";
import { prisma } from "@/infrastructure/db/prisma";
import { appendTicketEvent } from "@/infrastructure/db/ticket-event-repository";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

/** Nuove aperture: solo catalogo intake (legacy DB rows restano leggibili). */
export const createTicketSchema = z.object({
  storeId: z.string().min(1),
  category: z.enum(INTAKE_CATEGORY_VALUES),
  priority: z.nativeEnum(TicketPriority),
  description: z.string().trim().min(5).max(4000),
  assetId: z.string().optional().nullable(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export async function createTicket(input: {
  tenantId: string;
  actorUserId: string;
  role: Role;
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt">;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  assertCan(input.role, RbacAction.openTicket);

  const parsed = createTicketSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, message: "Dati ticket non validi", code: "invalidTicketData" };
  }

  if (!canAccessStore(input.membership, parsed.data.storeId)) {
    throw new ForbiddenError("Store fuori scope", "storeOutOfScope");
  }

  const store = await prisma.store.findFirst({
    where: {
      id: parsed.data.storeId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!store) {
    return {
      ok: false as const,
      message: "Punto vendita non trovato o archiviato",
      code: "storeNotFoundOrArchived",
    };
  }

  if (parsed.data.assetId) {
    const asset = await prisma.asset.findFirst({
      where: {
        id: parsed.data.assetId,
        tenantId: input.tenantId,
        storeId: store.id,
        deletedAt: null,
      },
    });
    if (!asset) {
      return { ok: false as const, message: "Asset non valido per lo store", code: "assetInvalidForStore" };
    }
  }

  const openedAt = new Date();
  const { slaDueAt } = await computeSlaDueAt({
    tenantId: input.tenantId,
    category: parsed.data.category,
    priority: parsed.data.priority,
    openedAt,
    storeTimezone: store.timezone,
  });

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.ticket.create({
      data: {
        tenantId: input.tenantId,
        storeId: store.id,
        assetId: parsed.data.assetId ?? null,
        category: parsed.data.category,
        priority: parsed.data.priority,
        status: TicketStatus.open,
        description: parsed.data.description,
        openedAt,
        slaDueAt,
        ...statusTimestampData(TicketStatus.open, openedAt),
      },
    });

    await appendTicketEvent(
      {
        tenantId: input.tenantId,
        ticketId: created.id,
        actorUserId: input.actorUserId,
        type: "ticket.created",
        fromStatus: null,
        toStatus: TicketStatus.open,
        meta: {
          category: created.category,
          priority: created.priority,
          storeId: created.storeId,
        },
      },
      tx,
    );

    return created;
  });

  const ticketWithStore = await prisma.ticket.findFirstOrThrow({
    where: { id: ticket.id, tenantId: input.tenantId },
    include: { store: true, vendor: true },
  });

  await emitTicketNotification({
    kind: "created",
    tenantId: input.tenantId,
    ticket: ticketWithStore,
    actorUserId: input.actorUserId,
  }).catch((e) => console.error("[createTicket] notify", e));

  return { ok: true as const, ticket };
}
