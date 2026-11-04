import { Role } from "@prisma/client";
import type { AiAssistSource } from "@/domain/ai/suggest-category";
import { getActiveMembership } from "@/application/memberships/membership-service";
import { ForbiddenError } from "@/domain/rbac/guards";
import { canAccessStore } from "@/domain/rbac/store-scope";
import { llmChatJson, llmConfigured } from "@/infrastructure/ai/llm-gateway";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

export type DraftMessage = {
  draft: string;
  source: AiAssistSource;
  needsConfirm: true;
};

const HQ = new Set<Role>([Role.owner, Role.admin_hq, Role.ops_coordinator]);

/** F7-05 A4 — bozza messaggio vendor/store; non invia. */
export async function draftOpsMessage(input: {
  tenantId: string;
  userId: string;
  ticketId: string;
  audience: "vendor" | "store";
  signal?: AbortSignal;
}): Promise<DraftMessage> {
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
    include: { store: true, vendor: true },
  });
  if (!ticket || !canAccessStore(membership, ticket.storeId)) {
    throw new ForbiddenError(undefined, "ticketNotAccessible");
  }

  const context = [
    `Store: ${ticket.store.name}`,
    `Vendor: ${ticket.vendor?.name ?? "n/d"}`,
    `Stato: ${ticket.status}`,
    `Categoria: ${ticket.category}`,
    ticket.description,
  ].join("\n");

  const fallback: DraftMessage = {
    draft:
      input.audience === "vendor"
        ? `Buongiorno,\nvi chiediamo aggiornamento sul ticket relativo a ${ticket.store.name} (${ticket.category}).\nGrazie,\nFacility HQ`
        : `Ciao,\naggiornamento sul vostro ticket (${ticket.category}): lo stiamo gestendo.\nHQ Facility`,
    source: "heuristic",
    needsConfirm: true,
  };

  if (!llmConfigured()) return fallback;

  try {
    const raw = await llmChatJson({
      system:
        'Rispondi SOLO JSON {"draft":"…"}. Bozza email/WhatsApp IT professionale max 120 parole. Non inventare SLA o costi.',
      user: `Destinatario: ${input.audience}\n${context}`,
      signal: input.signal,
    });
    if (!raw) return fallback;
    const obj = JSON.parse(raw.content.match(/\{[\s\S]*\}/)?.[0] ?? "{}") as {
      draft?: string;
    };
    const draft = String(obj.draft ?? "").trim();
    if (draft.length < 20) return fallback;
    return { draft, source: raw.source, needsConfirm: true };
  } catch {
    return fallback;
  }
}
