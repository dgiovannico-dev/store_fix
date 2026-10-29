import {
  parseOllamaCategoryJson,
  suggestCategoryHeuristic,
  type CategorySuggestion,
} from "@/domain/ai/suggest-category";
import { ollamaChatJson, ollamaConfigured } from "@/infrastructure/ai/ollama";

/**
 * Suggerimento categoria ticket (F2-07). Heuristic sempre; Ollama se configurato.
 * Caller deve chiedere conferma umana prima di scrivere SoR.
 */
export async function suggestTicketCategory(input: {
  description: string;
  signal?: AbortSignal;
}): Promise<CategorySuggestion> {
  const text = input.description.trim();
  const fallback = suggestCategoryHeuristic(text);
  if (text.length < 5 || !ollamaConfigured()) {
    return fallback;
  }

  try {
    const raw = await ollamaChatJson({
      system:
        'Sei un assistente facility retail IT. Rispondi SOLO JSON {"category":"<una di: frigo,hvac,casse,illuminazione,porte,altro>"}. Nessun altro testo.',
      user: `Descrivi il guasto e scegli la categoria:\n${text.slice(0, 1500)}`,
      signal: input.signal,
    });
    if (!raw) return fallback;
    const category = parseOllamaCategoryJson(raw);
    if (!category) return fallback;
    return {
      category,
      source: "ollama",
      rationale: "Suggerimento modello locale (da confermare)",
    };
  } catch {
    return fallback;
  }
}
