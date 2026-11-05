import type { TicketPriority } from "@prisma/client";
import type { AiAssistSource } from "@/domain/ai/suggest-category";
import {
  llmChatJson,
  llmConfigured,
  type AiAuditContext,
} from "@/infrastructure/ai/llm-gateway";
import { recordAiInvocation } from "@/infrastructure/ai/record-ai-invocation";

export type PrioritySuggestion = {
  priority: TicketPriority;
  source: AiAssistSource;
  rationale: string;
};

const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "critical"];

function heuristic(description: string): PrioritySuggestion {
  const hay = description.toLowerCase();
  if (/critico|emergenza|allag|fumo|corto|evacu/.test(hay)) {
    return {
      priority: "critical",
      source: "heuristic",
      rationale: "Keyword emergenza/critico",
    };
  }
  if (/urgente|blocc|chiuso al pubblico|non funziona/.test(hay)) {
    return {
      priority: "high",
      source: "heuristic",
      rationale: "Keyword urgenza operativa",
    };
  }
  if (/lieve|quando possibile|non urgente/.test(hay)) {
    return {
      priority: "low",
      source: "heuristic",
      rationale: "Keyword bassa urgenza",
    };
  }
  return {
    priority: "normal",
    source: "heuristic",
    rationale: "Priorità standard",
  };
}

/** F7-05 A1 — suggest priorità; conferma umana obbligatoria. */
export async function suggestTicketPriority(input: {
  description: string;
  category?: string;
  signal?: AbortSignal;
  audit?: AiAuditContext | null;
}): Promise<PrioritySuggestion> {
  const text = input.description.trim();
  const fallback = heuristic(text);
  const audit = input.audit
    ? { ...input.audit, feature: input.audit.feature || "suggest_priority" }
    : null;

  if (text.length < 5 || !llmConfigured()) {
    if (audit) {
      void recordAiInvocation({
        tenantId: audit.tenantId,
        userId: audit.userId,
        feature: audit.feature,
        provider: "heuristic",
        ok: true,
      });
    }
    return fallback;
  }

  try {
    const raw = await llmChatJson({
      system:
        'Rispondi SOLO JSON {"priority":"low|normal|high|critical"}. Facility retail IT.',
      user: `Categoria: ${input.category ?? "n/d"}\n${text.slice(0, 1500)}`,
      signal: input.signal,
      audit,
    });
    if (!raw) return fallback;
    const obj = JSON.parse(raw.content.match(/\{[\s\S]*\}/)?.[0] ?? "{}") as {
      priority?: string;
    };
    const p = String(obj.priority ?? "").toLowerCase() as TicketPriority;
    if (!PRIORITIES.includes(p)) return fallback;
    return {
      priority: p,
      source: raw.source,
      rationale: "Suggerimento modello (da confermare)",
    };
  } catch {
    return fallback;
  }
}
