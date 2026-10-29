import { Role } from "@prisma/client";
import {
  parseOllamaSummaryJson,
  summarizeNotesHeuristic,
  type NotesSummary,
} from "@/domain/ai/summarize-notes";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { ForbiddenError } from "@/domain/rbac/guards";
import { canAccessStore } from "@/domain/rbac/store-scope";
import { ollamaChatJson, ollamaConfigured } from "@/infrastructure/ai/ollama";
import { listTicketEvents } from "@/infrastructure/db/ticket-event-repository";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

const HQ = new Set<Role>([
  Role.owner,
  Role.admin_hq,
  Role.ops_coordinator,
]);

function metaText(meta: unknown): string {
  if (!meta || typeof meta !== "object") return "";
  const m = meta as Record<string, unknown>;
  return [m.note, m.noteInternal, m.reason, m.description]
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .join(" ");
}

export async function summarizeTicketNotes(input: {
  tenantId: string;
  userId: string;
  ticketId: string;
  signal?: AbortSignal;
}): Promise<NotesSummary> {
  requireTenantId(input.tenantId);
  const membership = await getActiveMembership(
    input.userId,
    input.tenantId,
  );
  if (!membership || !HQ.has(membership.role)) {
    throw new ForbiddenError("Solo HQ ops");
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!ticket || !canAccessStore(membership, ticket.storeId)) {
    throw new ForbiddenError("Ticket non accessibile");
  }

  const events = await listTicketEvents(input.tenantId, ticket.id);
  const parts = [
    `Categoria: ${ticket.category}. Priorità: ${ticket.priority}. Stato: ${ticket.status}.`,
    ticket.description,
    ...events.map((e) => {
      const extra = metaText(e.meta);
      return `${e.type}${e.toStatus ? ` → ${e.toStatus}` : ""}${extra ? `: ${extra}` : ""}`;
    }),
  ];
  const corpus = parts.filter(Boolean).join("\n");

  if (ollamaConfigured()) {
    const raw = await ollamaChatJson({
      system:
        'Rispondi solo JSON {"summary":"…"}. Riassumi in italiano operativo max 5 punti. Non inventare fatti.',
      user: corpus.slice(0, 6000),
      signal: input.signal,
    });
    if (raw) {
      const parsed = parseOllamaSummaryJson(raw);
      if (parsed) {
        return {
          summary: parsed,
          source: "ollama",
          bulletCount: parsed.split("\n").filter(Boolean).length,
        };
      }
    }
  }

  return summarizeNotesHeuristic(corpus);
}
