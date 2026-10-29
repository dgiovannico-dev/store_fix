import {
  INTAKE_CATEGORY_VALUES,
  type IntakeCategory,
} from "@/domain/intake/chat-steps";

export type CategorySuggestion = {
  category: IntakeCategory;
  source: "heuristic" | "ollama";
  rationale: string;
};

/** Heuristic IT (sempre disponibile) — mai SoR. */
export function suggestCategoryHeuristic(
  description: string,
): CategorySuggestion {
  const hay = description.toLowerCase();
  let category: IntakeCategory = "altro";
  let rationale = "Nessuna keyword specifica: categoria altro";
  if (/frigo|refriger|banco freddo|temperatura/.test(hay)) {
    category = "frigo";
    rationale = "Keyword frigo/refrigerazione";
  } else if (/hvac|clima|condizion|riscaldamento/.test(hay)) {
    category = "hvac";
    rationale = "Keyword HVAC/clima";
  } else if (/cassa|pos|registratore/.test(hay)) {
    category = "casse";
    rationale = "Keyword casse/POS";
  } else if (/luce|illumin|neon|lampad/.test(hay)) {
    category = "illuminazione";
    rationale = "Keyword illuminazione";
  } else if (/porta|serranda|ingresso|uscita di emergenza/.test(hay)) {
    category = "porte";
    rationale = "Keyword porte/serrande";
  }
  return { category, source: "heuristic", rationale };
}

export function parseOllamaCategoryJson(
  raw: string,
): IntakeCategory | null {
  const trimmed = raw.trim();
  try {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    const obj = JSON.parse(jsonMatch?.[0] ?? trimmed) as {
      category?: string;
    };
    const c = String(obj.category ?? "")
      .trim()
      .toLowerCase();
    if (INTAKE_CATEGORY_VALUES.includes(c as IntakeCategory)) {
      return c as IntakeCategory;
    }
  } catch {
    /* fallthrough */
  }
  const lower = trimmed.toLowerCase();
  for (const c of INTAKE_CATEGORY_VALUES) {
    if (lower.includes(`"${c}"`) || lower.includes(`: ${c}`) || lower === c) {
      return c;
    }
  }
  return null;
}
