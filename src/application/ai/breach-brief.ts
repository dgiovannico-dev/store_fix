/**
 * Breach brief — retrieve AssistTools → one llmChatJson → draft panel (no write).
 */

import { Role } from "@prisma/client";
import {
  toolAssetHistory,
  toolSimilarTickets,
  toolTicketSummaryReadonly,
  toolVendorScorecardSnippet,
} from "@/application/ai/assist-tools";
import { getActiveMembership } from "@/application/memberships/membership-service";
import { ForbiddenError } from "@/domain/rbac/guards";
import { canAccessStore } from "@/domain/rbac/store-scope";
import { llmChatJson, llmConfigured } from "@/infrastructure/ai/llm-gateway";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

const HQ = new Set<Role>([
  Role.owner,
  Role.admin_hq,
  Role.ops_coordinator,
]);

export type BreachBriefResult = {
  brief: string;
  suggestedActions: string[];
  citations: { ticketId: string }[];
  source: string;
  needsConfirm: true;
};

function heuristicBrief(ctx: {
  storeCode: string;
  category: string;
  vendorName: string | null;
  similarIds: string[];
}): BreachBriefResult {
  const lines = [
    `Breach su store ${ctx.storeCode}, categoria ${ctx.category}.`,
    ctx.vendorName
      ? `Vendor assegnato: ${ctx.vendorName}. Verificare ETA e coverage.`
      : "Nessun vendor assegnato — triage/assign prioritario.",
    ctx.similarIds.length
      ? `Casi simili SoR: ${ctx.similarIds.map((id) => id.slice(0, 8)).join(", ")}.`
      : "Nessun caso simile indicizzato.",
  ];
  return {
    brief: lines.join(" "),
    suggestedActions: [
      "Contattare vendor / store per ETA aggiornata",
      "Valutare rilancio notifica ops (azione manuale)",
      "Controllare storico asset se ricorrente",
    ],
    citations: ctx.similarIds.map((ticketId) => ({ ticketId })),
    source: "heuristic",
    needsConfirm: true,
  };
}

export async function generateBreachBrief(input: {
  tenantId: string;
  userId: string;
  ticketId: string;
  signal?: AbortSignal;
}): Promise<BreachBriefResult> {
  requireTenantId(input.tenantId);
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

  const [summary, similar] = await Promise.all([
    toolTicketSummaryReadonly({
      tenantId: input.tenantId,
      ticketId: ticket.id,
    }),
    toolSimilarTickets({
      tenantId: input.tenantId,
      userId: input.userId,
      ticketId: ticket.id,
      limit: 3,
      signal: input.signal,
    }),
  ]);

  const assetHistory = ticket.assetId
    ? await toolAssetHistory({
        tenantId: input.tenantId,
        assetId: ticket.assetId,
        excludeTicketId: ticket.id,
        limit: 5,
      })
    : [];

  const vendorSnippet = ticket.vendorId
    ? await toolVendorScorecardSnippet({
        tenantId: input.tenantId,
        vendorId: ticket.vendorId,
      })
    : null;

  const similarIds = similar.items.map((i) => i.ticketId);
  const base = heuristicBrief({
    storeCode: summary?.storeCode ?? "?",
    category: ticket.category,
    vendorName: summary?.vendorName ?? null,
    similarIds,
  });

  if (!llmConfigured()) return base;

  const system = `Sei un assistente ops facility retail. Rispondi SOLO JSON:
{"brief":"stringa IT max 400 char","suggestedActions":["..."],"citationTicketIds":["id"]}
Non inventare ID ticket: cita solo quelli forniti. Non ordinare chiusure/award/costi. Assist + conferma umana.`;

  const user = JSON.stringify({
    ticket: summary,
    similar: similar.items,
    assetHistory,
    vendorSnippet,
  });

  const llm = await llmChatJson({
    system,
    user,
    signal: input.signal,
  });
  if (!llm) return base;

  try {
    const parsed = JSON.parse(llm.content) as {
      brief?: string;
      suggestedActions?: string[];
      citationTicketIds?: string[];
    };
    const allowed = new Set(similarIds);
    const citations = (parsed.citationTicketIds ?? [])
      .filter((id) => allowed.has(id))
      .map((ticketId) => ({ ticketId }));
    return {
      brief: String(parsed.brief ?? base.brief).slice(0, 600),
      suggestedActions: (parsed.suggestedActions ?? base.suggestedActions)
        .map((s) => String(s).slice(0, 200))
        .slice(0, 5),
      citations: citations.length ? citations : base.citations,
      source: llm.source,
      needsConfirm: true,
    };
  } catch {
    return { ...base, source: llm.source };
  }
}
