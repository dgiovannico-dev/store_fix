/**
 * Similar tickets (F7-08) — cosine top-k tenant-scoped; heuristic keyword fallback.
 * Read-only — never writes SoR.
 */

import { Role } from "@prisma/client";
import { getActiveMembership } from "@/application/memberships/membership-service";
import { ForbiddenError } from "@/domain/rbac/guards";
import { canAccessStore } from "@/domain/rbac/store-scope";
import { llmEmbed, vectorToSql } from "@/infrastructure/ai/embed";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

const HQ = new Set<Role>([
  Role.owner,
  Role.admin_hq,
  Role.ops_coordinator,
]);

export type SimilarTicketHit = {
  ticketId: string;
  score: number;
  category: string;
  status: string;
  snippet: string;
  storeCode: string | null;
};

export type SimilarTicketsResult = {
  items: SimilarTicketHit[];
  source: "embedding" | "heuristic";
  needsConfirm: true;
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3)
    .slice(0, 24);
}

async function heuristicSimilar(input: {
  tenantId: string;
  ticketId: string;
  description: string;
  category: string;
  limit: number;
}): Promise<SimilarTicketHit[]> {
  const tokens = tokenize(`${input.category} ${input.description}`);
  if (tokens.length === 0) return [];

  const candidates = await prisma.ticket.findMany({
    where: {
      tenantId: input.tenantId,
      deletedAt: null,
      id: { not: input.ticketId },
      OR: [
        { category: input.category },
        ...tokens.slice(0, 8).map((t) => ({
          description: { contains: t, mode: "insensitive" as const },
        })),
      ],
    },
    take: 40,
    orderBy: { updatedAt: "desc" },
    include: { store: { select: { name: true, city: true } } },
  });

  const scored = candidates.map((t) => {
    const blob = `${t.category} ${t.description}`.toLowerCase();
    let hits = 0;
    for (const tok of tokens) {
      if (blob.includes(tok)) hits += 1;
    }
    if (t.category === input.category) hits += 2;
    return {
      ticketId: t.id,
      score: Math.min(0.95, hits / Math.max(tokens.length, 1)),
      category: t.category,
      status: t.status,
      snippet: t.description.slice(0, 160),
      storeCode: t.store?.city ?? t.store?.name ?? null,
    };
  });

  return scored
    .filter((s) => s.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit);
}

export async function findSimilarTickets(input: {
  tenantId: string;
  userId: string;
  ticketId: string;
  limit?: number;
  signal?: AbortSignal;
}): Promise<SimilarTicketsResult> {
  requireTenantId(input.tenantId);
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 10);

  const membership = await getActiveMembership(input.userId, input.tenantId);
  if (!membership || !HQ.has(membership.role)) {
    throw new ForbiddenError(undefined, "hqOpsOnly");
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!ticket) throw new ForbiddenError(undefined, "ticketNotFound");
  if (!canAccessStore(membership, ticket.storeId)) {
    throw new ForbiddenError(undefined, "storeOutOfScope");
  }

  const queryText = `${ticket.category}\n${ticket.description}`.slice(0, 2000);
  const emb = await llmEmbed(queryText, input.signal);

  if (emb) {
    const sqlVec = vectorToSql(emb.vector);
    type Row = {
      ticketId: string;
      score: number;
      chunkText: string;
      category: string;
      status: string;
      storeCode: string | null;
    };
    const rows = await prisma.$queryRawUnsafe<Row[]>(
      `SELECT e."ticketId" AS "ticketId",
              (1 - (e."embedding" <=> $1::vector))::float AS score,
              e."chunkText" AS "chunkText",
              t.category AS category,
              t.status::text AS status,
              COALESCE(s.city, s.name) AS "storeCode"
       FROM "TicketEmbedding" e
       INNER JOIN "Ticket" t ON t.id = e."ticketId" AND t."tenantId" = e."tenantId"
       LEFT JOIN "Store" s ON s.id = t."storeId"
       WHERE e."tenantId" = $2
         AND e."ticketId" <> $3
         AND t."deletedAt" IS NULL
       ORDER BY e."embedding" <=> $1::vector
       LIMIT $4`,
      sqlVec,
      input.tenantId,
      ticket.id,
      limit * 3,
    );

    // Dedupe by ticketId keeping best score
    const best = new Map<string, SimilarTicketHit>();
    for (const r of rows) {
      const prev = best.get(r.ticketId);
      const hit: SimilarTicketHit = {
        ticketId: r.ticketId,
        score: Number(r.score) || 0,
        category: r.category,
        status: r.status,
        snippet: (r.chunkText || "").slice(0, 160),
        storeCode: r.storeCode,
      };
      if (!prev || hit.score > prev.score) best.set(r.ticketId, hit);
    }
    const items = [...best.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (items.length > 0) {
      return { items, source: "embedding", needsConfirm: true };
    }
  }

  const items = await heuristicSimilar({
    tenantId: input.tenantId,
    ticketId: ticket.id,
    description: ticket.description,
    category: ticket.category,
    limit,
  });
  return { items, source: "heuristic", needsConfirm: true };
}
