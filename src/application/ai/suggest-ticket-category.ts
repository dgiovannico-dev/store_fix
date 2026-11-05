import {
  parseOllamaCategoryJson,
  suggestCategoryHeuristic,
  type CategorySuggestion,
} from "@/domain/ai/suggest-category";
import {
  llmChatJson,
  llmConfigured,
  type AiAuditContext,
} from "@/infrastructure/ai/llm-gateway";
import { recordAiInvocation } from "@/infrastructure/ai/record-ai-invocation";

/**
 * Suggerimento categoria ticket (F2-07 / F7). Heuristic sempre; LLM se configurato.
 * Caller deve chiedere conferma umana prima di scrivere SoR.
 */
export async function suggestTicketCategory(input: {
  description: string;
  signal?: AbortSignal;
  audit?: AiAuditContext | null;
}): Promise<CategorySuggestion> {
  const text = input.description.trim();
  const fallback = suggestCategoryHeuristic(text);
  const audit = input.audit
    ? { ...input.audit, feature: input.audit.feature || "suggest_category" }
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
        'Sei un assistente facility retail IT. Rispondi SOLO JSON {"category":"<una di: frigo,hvac,casse,illuminazione,porte,altro>"}. Nessun altro testo.',
      user: `Descrivi il guasto e scegli la categoria:\n${text.slice(0, 1500)}`,
      signal: input.signal,
      audit,
    });
    if (!raw) return fallback;
    const category = parseOllamaCategoryJson(raw.content);
    if (!category) return fallback;
    return {
      category,
      source: raw.source,
      rationale: "Suggerimento modello (da confermare)",
    };
  } catch {
    return fallback;
  }
}
