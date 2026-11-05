/**
 * A5 polish — digest narrativo settimanale con citazioni ticket SoR (read-only draft).
 */

import { Role, TicketStatus } from "@prisma/client";
import { getActiveMembership } from "@/application/memberships/membership-service";
import { ForbiddenError } from "@/domain/rbac/guards";
import { OPEN_TICKET_STATUSES } from "@/domain/ticket/status";
import { llmChatJson, llmConfigured } from "@/infrastructure/ai/llm-gateway";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

const HQ = new Set<Role>([
  Role.owner,
  Role.admin_hq,
  Role.ops_coordinator,
]);

export type DigestNarrativeResult = {
  narrative: string;
  citations: { ticketId: string; reason: string }[];
  metrics: {
    open: number;
    breached: number;
    verified: number;
  };
  source: string;
  needsConfirm: true;
};

export async function generateDigestNarrative(input: {
  tenantId: string;
  userId: string;
  signal?: AbortSignal;
}): Promise<DigestNarrativeResult> {
  requireTenantId(input.tenantId);
  const membership = await getActiveMembership(input.userId, input.tenantId);
  if (!membership || !HQ.has(membership.role)) {
    throw new ForbiddenError(undefined, "hqOpsOnly");
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [open, breachedTickets, verifiedTickets] = await Promise.all([
    prisma.ticket.count({
      where: {
        tenantId: input.tenantId,
        deletedAt: null,
        status: { in: [...OPEN_TICKET_STATUSES] },
      },
    }),
    prisma.ticket.findMany({
      where: {
        tenantId: input.tenantId,
        deletedAt: null,
        slaBreachedAt: { not: null, gte: since },
      },
      take: 8,
      orderBy: { slaBreachedAt: "desc" },
      select: {
        id: true,
        category: true,
        description: true,
        store: { select: { name: true, city: true } },
      },
    }),
    prisma.ticket.findMany({
      where: {
        tenantId: input.tenantId,
        deletedAt: null,
        status: TicketStatus.verified,
        verifiedAt: { gte: since },
      },
      take: 8,
      orderBy: { verifiedAt: "desc" },
      select: {
        id: true,
        category: true,
        actualCost: true,
        store: { select: { name: true, city: true } },
      },
    }),
  ]);

  const metrics = {
    open,
    breached: breachedTickets.length,
    verified: verifiedTickets.length,
  };

  const citationIds = [
    ...breachedTickets.map((t) => t.id),
    ...verifiedTickets.map((t) => t.id),
  ];
  const allowed = new Set(citationIds);

  const heuristic: DigestNarrativeResult = {
    narrative: `Settimana: ${open} aperti, ${breachedTickets.length} breach recenti, ${verifiedTickets.length} verificati. Rivedere breach e costi verificati prima del digest email.`,
    citations: [
      ...breachedTickets.slice(0, 3).map((t) => ({
        ticketId: t.id,
        reason: `breach ${t.store.city ?? t.store.name}/${t.category}`,
      })),
      ...verifiedTickets.slice(0, 2).map((t) => ({
        ticketId: t.id,
        reason: `verified ${t.store.city ?? t.store.name}`,
      })),
    ],
    metrics,
    source: "heuristic",
    needsConfirm: true,
  };

  const audit = {
    tenantId: input.tenantId,
    userId: input.userId,
    feature: "digest_narrative",
  };

  if (!llmConfigured()) {
    const { recordAiInvocation } = await import(
      "@/infrastructure/ai/record-ai-invocation"
    );
    void recordAiInvocation({
      ...audit,
      provider: "heuristic",
      ok: true,
    });
    return heuristic;
  }

  const system = `Sei un assist HQ facility. JSON only:
{"narrative":"IT max 500 char","citations":[{"ticketId":"…","reason":"…"}]}
Cita SOLO ticketId forniti. Non inventare numeri fuori metrics. Assist — conferma umana prima dell'invio digest.`;

  const user = JSON.stringify({
    metrics,
    breached: breachedTickets.map((t) => ({
      ticketId: t.id,
      store: t.store.city ?? t.store.name,
      category: t.category,
      snippet: t.description.slice(0, 80),
    })),
    verified: verifiedTickets.map((t) => ({
      ticketId: t.id,
      store: t.store.city ?? t.store.name,
      category: t.category,
      actualCost: t.actualCost != null ? Number(t.actualCost) : null,
    })),
  });

  const llm = await llmChatJson({
    system,
    user,
    signal: input.signal,
    audit,
  });
  if (!llm) {
    const { recordAiInvocation } = await import(
      "@/infrastructure/ai/record-ai-invocation"
    );
    void recordAiInvocation({
      ...audit,
      provider: "heuristic",
      ok: true,
    });
    return heuristic;
  }

  try {
    const parsed = JSON.parse(llm.content) as {
      narrative?: string;
      citations?: { ticketId?: string; reason?: string }[];
    };
    const citations = (parsed.citations ?? [])
      .filter((c) => c.ticketId && allowed.has(c.ticketId))
      .map((c) => ({
        ticketId: c.ticketId!,
        reason: String(c.reason ?? "").slice(0, 120),
      }))
      .slice(0, 8);
    return {
      narrative: String(parsed.narrative ?? heuristic.narrative).slice(0, 700),
      citations: citations.length ? citations : heuristic.citations,
      metrics,
      source: llm.source,
      needsConfirm: true,
    };
  } catch {
    return { ...heuristic, source: llm.source };
  }
}
