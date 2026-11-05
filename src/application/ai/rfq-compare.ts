/**
 * A6 polish — confronto offerte RFQ (pro/contro). Mai auto-award.
 */

import { Role } from "@prisma/client";
import { getQuoteRequest } from "@/application/rfq/rfq-service";
import { getActiveMembership } from "@/application/memberships/membership-service";
import { canMutate } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { ForbiddenError } from "@/domain/rbac/guards";
import { llmChatJson, llmConfigured } from "@/infrastructure/ai/llm-gateway";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

const HQ = new Set<Role>([
  Role.owner,
  Role.admin_hq,
  Role.ops_coordinator,
]);

export type RfqCompareResult = {
  comparison: string;
  prosCons: { bidId: string; vendorName: string; pros: string[]; cons: string[] }[];
  caution: string;
  source: string;
  needsConfirm: true;
};

export async function compareRfqOffers(input: {
  tenantId: string;
  userId: string;
  requestId: string;
  signal?: AbortSignal;
}): Promise<RfqCompareResult> {
  requireTenantId(input.tenantId);
  const membership = await getActiveMembership(input.userId, input.tenantId);
  if (!membership || !HQ.has(membership.role)) {
    throw new ForbiddenError(undefined, "hqOpsOnly");
  }
  if (!canMutate(membership.role, RbacAction.manageRfq)) {
    throw new ForbiddenError(undefined, "rfqForbidden");
  }

  const request = await getQuoteRequest({
    tenantId: input.tenantId,
    role: membership.role,
    requestId: input.requestId,
  });
  if (!request) throw new ForbiddenError(undefined, "rfqNotFound");

  const submitted = request.bids.filter((b) => b.status === "submitted");
  const caution =
    "Suggerimento assist — l'award resta sempre manuale (nessun auto-award).";

  const heuristicProsCons = submitted.map((b) => {
    const amount = b.amountEur != null ? Number(b.amountEur) : null;
    const amounts = submitted
      .map((x) => (x.amountEur != null ? Number(x.amountEur) : null))
      .filter((n): n is number => n != null);
    const min = amounts.length ? Math.min(...amounts) : null;
    const pros: string[] = [];
    const cons: string[] = [];
    if (amount != null && min != null && amount === min) {
      pros.push("Importo più basso tra le offerte");
    } else if (amount != null) {
      cons.push("Importo non il più basso");
    }
    if (b.note?.trim()) pros.push("Nota vendor presente");
    else cons.push("Nessuna nota a supporto");
    return {
      bidId: b.id,
      vendorName: b.vendor.name,
      pros,
      cons,
    };
  });

  const heuristic: RfqCompareResult = {
    comparison:
      submitted.length === 0
        ? "Nessuna offerta submitted da confrontare."
        : `Confronto heuristic su ${submitted.length} offerte. Verificare coverage e SLA prima dell'award manuale.`,
    prosCons: heuristicProsCons,
    caution,
    source: "heuristic",
    needsConfirm: true,
  };

  const audit = {
    tenantId: input.tenantId,
    userId: input.userId,
    feature: "rfq_compare",
  };

  if (!llmConfigured() || submitted.length === 0) {
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

  const system = `Assist RFQ facility. JSON only:
{"comparison":"IT max 400","prosCons":[{"bidId":"…","vendorName":"…","pros":["…"],"cons":["…"]}]}
Non scegliere un winner. Non award. Solo pro/contro. bidId devono essere quelli forniti.`;

  const user = JSON.stringify({
    title: request.title,
    notes: request.notes,
    bids: submitted.map((b) => ({
      bidId: b.id,
      vendorName: b.vendor.name,
      amountEur: b.amountEur != null ? Number(b.amountEur) : null,
      note: b.note,
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
      comparison?: string;
      prosCons?: {
        bidId?: string;
        vendorName?: string;
        pros?: string[];
        cons?: string[];
      }[];
    };
    const allowed = new Set(submitted.map((b) => b.id));
    const nameById = new Map(submitted.map((b) => [b.id, b.vendor.name]));
    const prosCons = (parsed.prosCons ?? [])
      .filter((p) => p.bidId && allowed.has(p.bidId))
      .map((p) => ({
        bidId: p.bidId!,
        vendorName: nameById.get(p.bidId!) ?? String(p.vendorName ?? ""),
        pros: (p.pros ?? []).map((s) => String(s).slice(0, 120)).slice(0, 4),
        cons: (p.cons ?? []).map((s) => String(s).slice(0, 120)).slice(0, 4),
      }));
    return {
      comparison: String(parsed.comparison ?? heuristic.comparison).slice(
        0,
        600,
      ),
      prosCons: prosCons.length ? prosCons : heuristic.prosCons,
      caution,
      source: llm.source,
      needsConfirm: true,
    };
  } catch {
    return { ...heuristic, source: llm.source };
  }
}
