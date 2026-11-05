/**
 * Index ticket chunks → TicketEmbedding (idempotent upsert).
 * Trigger: verified / cancelled closed-like. Never mutates ticket SoR fields.
 */

import { TicketStatus } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { chunkTicketText } from "@/application/ai/chunk-ticket-text";
import { llmEmbed, vectorToSql } from "@/infrastructure/ai/embed";
import { recordAiInvocation } from "@/infrastructure/ai/record-ai-invocation";
import { listTicketEvents } from "@/infrastructure/db/ticket-event-repository";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";
import { logJson } from "@/infrastructure/log";

function metaNote(meta: unknown): string {
  if (!meta || typeof meta !== "object") return "";
  const m = meta as Record<string, unknown>;
  return [m.note, m.noteInternal, m.reason, m.description]
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .join(" ");
}

const INDEXABLE = new Set<TicketStatus>([
  TicketStatus.verified,
  TicketStatus.cancelled,
  TicketStatus.done,
]);

export async function indexTicketChunks(input: {
  tenantId: string;
  ticketId: string;
  signal?: AbortSignal;
}): Promise<{ ok: true; chunks: number; skipped?: string } | { ok: false; reason: string }> {
  requireTenantId(input.tenantId);

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!ticket) return { ok: false, reason: "ticketNotFound" };
  if (!INDEXABLE.has(ticket.status)) {
    return { ok: true, chunks: 0, skipped: "statusNotIndexable" };
  }

  const events = await listTicketEvents(input.tenantId, ticket.id);
  const notes = events
    .map((e) => metaNote(e.meta))
    .filter(Boolean)
    .slice(-20);

  const chunks = chunkTicketText({
    category: ticket.category,
    description: ticket.description,
    completionReport: ticket.completionReport,
    notes,
  });
  if (chunks.length === 0) {
    await prisma.ticketEmbedding.deleteMany({
      where: { tenantId: input.tenantId, ticketId: ticket.id },
    });
    return { ok: true, chunks: 0, skipped: "emptyText" };
  }

  const embedded: { index: number; text: string; vector: number[] }[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const emb = await llmEmbed(chunks[i]!, input.signal);
    if (!emb) {
      logJson("warn", "ai.index_ticket.embed_failed", {
        tenantId: input.tenantId,
        ticketId: ticket.id,
        chunk: i,
      });
      return { ok: false, reason: "embedUnavailable" };
    }
    embedded.push({ index: i, text: chunks[i]!, vector: emb.vector });
  }

  // Replace all chunks for ticket (idempotent)
  await prisma.$transaction(async (tx) => {
    await tx.ticketEmbedding.deleteMany({
      where: { tenantId: input.tenantId, ticketId: ticket.id },
    });
    for (const row of embedded) {
      const id = createHash("sha256")
        .update(`${ticket.id}:${row.index}`)
        .digest("hex")
        .slice(0, 24);
      const sqlVec = vectorToSql(row.vector);
      await tx.$executeRawUnsafe(
        `INSERT INTO "TicketEmbedding" ("id","tenantId","ticketId","chunkIndex","chunkText","embedding","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6::vector,NOW(),NOW())`,
        id || randomUUID().replace(/-/g, "").slice(0, 24),
        input.tenantId,
        ticket.id,
        row.index,
        row.text,
        sqlVec,
      );
    }
  });

  logJson("info", "ai.index_ticket", {
    tenantId: input.tenantId,
    ticketId: ticket.id,
    chunks: embedded.length,
  });
  void recordAiInvocation({
    tenantId: input.tenantId,
    feature: "index_ticket",
    provider: "embed",
    ok: true,
  });
  return { ok: true, chunks: embedded.length };
}
