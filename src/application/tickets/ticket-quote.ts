import {
  QuoteStatus,
  Role,
  type Membership,
} from "@prisma/client";
import { z } from "zod";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCan, ForbiddenError } from "@/domain/rbac/guards";
import { canAccessStore } from "@/domain/rbac/store-scope";
import { TicketEventType } from "@/domain/ticket/event-types";
import {
  canDecideQuote,
  canProposeQuote,
  parseQuoteAmount,
} from "@/domain/ticket/quote";
import { appendTicketEvent } from "@/infrastructure/db/ticket-event-repository";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";
import { assertVendorTicketScope } from "./vendor-scope";

const proposeSchema = z.object({
  amountEur: z.coerce.number().positive().max(1_000_000),
  note: z.string().trim().max(500).optional().nullable(),
});

/**
 * Vendor propone/aggiorna preventivo (F2-02) → estimatedCost + quoteStatus=pending.
 */
export async function proposeTicketQuote(input: {
  tenantId: string;
  ticketId: string;
  actorUserId: string;
  role: Role;
  membership: Pick<Membership, "role" | "vendorId" | "deletedAt" | "storeIds">;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  try {
    assertCan(input.role, RbacAction.vendorStatus);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false as const, code: e.code ?? "forbidden" };
    }
    throw e;
  }

  const parsed = proposeSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, code: "quoteAmountInvalid" };
  }
  const amount = parseQuoteAmount(parsed.data.amountEur);
  if (amount == null) {
    return { ok: false as const, code: "quoteAmountInvalid" };
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!ticket) return { ok: false as const, code: "ticketNotFound" };

  try {
    assertVendorTicketScope(input.membership, ticket, input.role);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false as const, code: e.code ?? "forbidden" };
    }
    throw e;
  }

  if (!canProposeQuote(ticket.status)) {
    return {
      ok: false as const,
      code: "quoteOnlyAssigned",
    };
  }

  const previous = ticket.estimatedCost != null ? Number(ticket.estimatedCost) : null;

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        estimatedCost: amount,
        quoteStatus: QuoteStatus.pending,
      },
    });
    await appendTicketEvent(
      {
        tenantId: input.tenantId,
        ticketId: ticket.id,
        actorUserId: input.actorUserId,
        type: TicketEventType.quoteProposed,
        meta: {
          amountEur: amount,
          note: parsed.data.note ?? null,
          previousAmount: previous,
        },
      },
      tx,
    );
    return t;
  });

  return { ok: true as const, ticket: updated };
}

const decideSchema = z.object({
  decision: z.enum(["accept", "reject"]),
  reason: z.string().trim().max(500).optional().nullable(),
});

/**
 * Store manager / HQ accetta o rifiuta preventivo pending.
 */
export async function decideTicketQuote(input: {
  tenantId: string;
  ticketId: string;
  actorUserId: string;
  role: Role;
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt">;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  try {
    assertCan(input.role, RbacAction.acceptQuote);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false as const, code: e.code ?? "forbidden" };
    }
    throw e;
  }

  const parsed = decideSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, code: "quoteDecisionInvalid" };
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!ticket) return { ok: false as const, code: "ticketNotFound" };

  if (!canAccessStore(input.membership, ticket.storeId)) {
    return { ok: false as const, code: "storeOutOfScope" };
  }

  if (!canDecideQuote(ticket.status, ticket.quoteStatus)) {
    return {
      ok: false as const,
      code: "noPendingQuote",
    };
  }

  const accept = parsed.data.decision === "accept";
  const amount =
    ticket.estimatedCost != null ? Number(ticket.estimatedCost) : null;

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        quoteStatus: accept ? QuoteStatus.accepted : QuoteStatus.rejected,
        ...(accept
          ? {}
          : {
              // Rifiuto: azzera importo corrente; storico in eventi
              estimatedCost: null,
            }),
      },
    });
    await appendTicketEvent(
      {
        tenantId: input.tenantId,
        ticketId: ticket.id,
        actorUserId: input.actorUserId,
        type: accept
          ? TicketEventType.quoteAccepted
          : TicketEventType.quoteRejected,
        meta: {
          amountEur: amount,
          reason: parsed.data.reason ?? null,
        },
      },
      tx,
    );
    return t;
  });

  return { ok: true as const, ticket: updated };
}
