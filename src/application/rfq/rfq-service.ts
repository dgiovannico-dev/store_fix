import {
  QuoteBidStatus,
  QuoteRequestStatus,
  QuoteStatus,
  Role,
  TicketStatus,
  type Membership,
} from "@prisma/client";
import { z } from "zod";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCan, assertCanMutate, ForbiddenError } from "@/domain/rbac/guards";
import { canAwardRfqBid, canSubmitRfqBid } from "@/domain/rfq/rules";
import { parseQuoteAmount } from "@/domain/ticket/quote";
import { TicketEventType } from "@/domain/ticket/event-types";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { enqueueEmail } from "@/infrastructure/email/outbox";
import { appendTicketEvent } from "@/infrastructure/db/ticket-event-repository";
import { prisma } from "@/infrastructure/db/prisma";
import {
  requireTenantId,
  tenantActiveWhere,
} from "@/infrastructure/db/tenant-scope";

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

const createSchema = z.object({
  title: z.string().trim().min(2).max(200),
  notes: z
    .union([z.string().trim().max(2000), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  ticketId: z
    .union([z.string().min(1), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  vendorIds: z.array(z.string().min(1)).min(1).max(20),
});

const bidSchema = z.object({
  amountEur: z.coerce.number().positive().max(1_000_000),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function createQuoteRequest(input: {
  tenantId: string;
  role: Role;
  actorUserId: string;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.manageRfq);

  const parsed = createSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, code: "invalidRfqData" };
  }

  let storeId: string | null = null;
  if (parsed.data.ticketId) {
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: parsed.data.ticketId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
    });
    if (!ticket) return { ok: false as const, code: "ticketNotFound" };
    storeId = ticket.storeId;
  }

  const vendors = await prisma.vendor.findMany({
    where: {
      id: { in: parsed.data.vendorIds },
      ...tenantActiveWhere(input.tenantId),
    },
  });
  if (vendors.length !== parsed.data.vendorIds.length) {
    return { ok: false as const, code: "vendorsInvalid" };
  }

  const uniqueIds = [...new Set(parsed.data.vendorIds)];
  const request = await prisma.quoteRequest.create({
    data: {
      tenantId: input.tenantId,
      title: parsed.data.title,
      notes: parsed.data.notes,
      ticketId: parsed.data.ticketId,
      storeId,
      status: QuoteRequestStatus.open,
      createdByUserId: input.actorUserId,
      bids: {
        create: uniqueIds.map((vendorId) => ({
          tenantId: input.tenantId,
          vendorId,
          status: QuoteBidStatus.invited,
        })),
      },
    },
    include: {
      bids: { include: { vendor: { select: { id: true, name: true, email: true } } } },
    },
  });

  const rfqUrl = `${appBaseUrl()}/vendor/rfq/${request.id}`;
  const { locale } = await getTenantI18nPrefs(input.tenantId);
  await Promise.all(
    request.bids.map(async (bid) => {
      const to = bid.vendor.email?.trim();
      if (!to) return;
      await enqueueEmail({
        to,
        template: "rfq_invite",
        locale,
        vars: {
          vendorName: bid.vendor.name,
          summary: request.title,
          rfqUrl,
          ticketId: request.ticketId ?? request.id,
        },
        idempotencyKey: `rfq_invite:${request.id}:${bid.vendorId}`,
      }).catch((e) => console.error("[rfq.invite]", e));
    }),
  );

  return { ok: true as const, request };
}

export async function listQuoteRequests(input: {
  tenantId: string;
  role: Role;
}) {
  requireTenantId(input.tenantId);
  assertCan(input.role, RbacAction.manageRfq);
  return prisma.quoteRequest.findMany({
    where: { tenantId: input.tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      bids: { include: { vendor: { select: { id: true, name: true } } } },
      ticket: { select: { id: true } },
      store: { select: { id: true, name: true } },
    },
  });
}

export async function getQuoteRequest(input: {
  tenantId: string;
  role: Role;
  requestId: string;
  membership?: Pick<Membership, "role" | "vendorId" | "deletedAt">;
}) {
  requireTenantId(input.tenantId);
  const request = await prisma.quoteRequest.findFirst({
    where: {
      id: input.requestId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
    include: {
      bids: {
        include: { vendor: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      ticket: { select: { id: true, status: true } },
      store: { select: { id: true, name: true } },
    },
  });
  if (!request) return null;

  if (input.role === Role.vendor) {
    assertCan(input.role, RbacAction.respondRfq);
    const vendorId = input.membership?.vendorId;
    if (!vendorId) throw new ForbiddenError(undefined, "membershipVendorRequired");
    const own = request.bids.filter((b) => b.vendorId === vendorId);
    if (own.length === 0) throw new ForbiddenError(undefined, "rfqNotAssigned");
    return { ...request, bids: own };
  }

  assertCan(input.role, RbacAction.manageRfq);
  return request;
}

export async function listVendorQuoteBids(input: {
  tenantId: string;
  role: Role;
  membership: Pick<Membership, "vendorId" | "deletedAt">;
}) {
  requireTenantId(input.tenantId);
  assertCan(input.role, RbacAction.respondRfq);
  const vendorId = input.membership.vendorId;
  if (!vendorId) throw new ForbiddenError(undefined, "membershipVendorRequired");

  return prisma.quoteBid.findMany({
    where: {
      tenantId: input.tenantId,
      vendorId,
      quoteRequest: { deletedAt: null },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      quoteRequest: {
        select: {
          id: true,
          title: true,
          status: true,
          notes: true,
          ticketId: true,
        },
      },
    },
  });
}

export async function submitQuoteBid(input: {
  tenantId: string;
  role: Role;
  membership: Pick<Membership, "vendorId" | "deletedAt">;
  bidId: string;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  try {
    assertCan(input.role, RbacAction.respondRfq);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false as const, code: e.code ?? "forbidden" };
    }
    throw e;
  }
  const vendorId = input.membership.vendorId;
  if (!vendorId) {
    return { ok: false as const, code: "membershipVendorRequired" };
  }

  const parsed = bidSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, code: "amountInvalid" };
  }
  const amount = parseQuoteAmount(parsed.data.amountEur);
  if (amount == null) {
    return { ok: false as const, code: "amountInvalid" };
  }

  const bid = await prisma.quoteBid.findFirst({
    where: {
      id: input.bidId,
      tenantId: input.tenantId,
      vendorId,
    },
    include: { quoteRequest: true },
  });
  if (!bid) return { ok: false as const, code: "rfqInviteNotFound" };

  if (
    !canSubmitRfqBid({
      requestStatus: bid.quoteRequest.status,
      bidStatus: bid.status,
    })
  ) {
    return { ok: false as const, code: "rfqNotAcceptable" };
  }

  const updated = await prisma.quoteBid.update({
    where: { id: bid.id },
    data: {
      amountEur: amount,
      note: parsed.data.note ?? null,
      status: QuoteBidStatus.submitted,
      submittedAt: new Date(),
    },
  });
  return { ok: true as const, bid: updated };
}

export async function awardQuoteBid(input: {
  tenantId: string;
  role: Role;
  actorUserId: string;
  requestId: string;
  bidId: string;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.manageRfq);

  const request = await prisma.quoteRequest.findFirst({
    where: {
      id: input.requestId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
    include: { bids: true },
  });
  if (!request) return { ok: false as const, code: "rfqNotFound" };

  const bid = request.bids.find((b) => b.id === input.bidId);
  if (!bid) return { ok: false as const, code: "bidNotFound" };

  if (
    !canAwardRfqBid({
      requestStatus: request.status,
      bidStatus: bid.status,
      amountEur: bid.amountEur,
    })
  ) {
    return { ok: false as const, code: "bidNotAwardable" };
  }

  const amount = Number(bid.amountEur);
  await prisma.$transaction(async (tx) => {
    await tx.quoteRequest.update({
      where: { id: request.id },
      data: {
        status: QuoteRequestStatus.awarded,
        awardedBidId: bid.id,
      },
    });

    if (request.ticketId) {
      const ticket = await tx.ticket.findFirst({
        where: {
          id: request.ticketId,
          tenantId: input.tenantId,
          deletedAt: null,
        },
      });
      if (ticket) {
        const nextStatus =
          ticket.status === TicketStatus.open ||
          ticket.status === TicketStatus.triaged
            ? TicketStatus.assigned
            : ticket.status;
        await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            vendorId: bid.vendorId,
            estimatedCost: amount,
            quoteStatus: QuoteStatus.accepted,
            status: nextStatus,
            assignedAt: ticket.assignedAt ?? new Date(),
          },
        });
        await appendTicketEvent(
          {
            tenantId: input.tenantId,
            ticketId: ticket.id,
            actorUserId: input.actorUserId,
            type: TicketEventType.quoteAccepted,
            fromStatus: ticket.status,
            toStatus: nextStatus,
            meta: {
              source: "rfq_award",
              quoteRequestId: request.id,
              bidId: bid.id,
              amountEur: amount,
              vendorId: bid.vendorId,
            },
          },
          tx,
        );
      }
    }
  });

  return { ok: true as const };
}
