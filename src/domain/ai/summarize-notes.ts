import type { AiAssistSource } from "@/domain/ai/suggest-category";

export type NotesSummary = {
  summary: string;
  suggestedSolution: string;
  source: AiAssistSource;
  bulletCount: number;
};

/**
 * Riassunto estrattivo IT (F3-03) — mai SoR.
 * Prende le frasi più informative / lunghe fino a maxBullets.
 */
export function summarizeNotesHeuristic(
  text: string,
  maxBullets = 5,
): NotesSummary {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length < 8) {
    return {
      summary: "Poco testo da riassumere.",
      suggestedSolution:
        "Raccogliere più dettagli sul guasto (sintomi, asset, foto) prima di intervenire.",
      source: "heuristic",
      bulletCount: 0,
    };
  }

  const sentences = normalized
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12);

  const ranked = [...sentences].sort((a, b) => b.length - a.length);
  const picked: string[] = [];
  for (const s of ranked) {
    if (picked.length >= maxBullets) break;
    if (picked.some((p) => p.includes(s) || s.includes(p))) continue;
    picked.push(s.length > 180 ? `${s.slice(0, 177)}…` : s);
  }

  // Ordine di apparizione originale
  const ordered = sentences.filter((s) =>
    picked.some(
      (p) => s.startsWith(p.slice(0, 40)) || p.startsWith(s.slice(0, 40)),
    ),
  );
  const bullets = (ordered.length ? ordered : picked).slice(0, maxBullets);

  if (bullets.length === 0) {
    return {
      summary: normalized.slice(0, 240) + (normalized.length > 240 ? "…" : ""),
      suggestedSolution: heuristicSolution(normalized),
      source: "heuristic",
      bulletCount: 1,
    };
  }

  return {
    summary: bullets.map((b) => `• ${b}`).join("\n"),
    suggestedSolution: heuristicSolution(normalized),
    source: "heuristic",
    bulletCount: bullets.length,
  };
}

function heuristicSolution(corpus: string): string {
  const lower = corpus.toLowerCase();
  const steps: string[] = [];
  if (/frig|freddo|temperatura|hvac|clima/.test(lower)) {
    steps.push(
      "Verificare temperature e allarmi sul banco/impianto; confrontare con set-point.",
    );
  }
  if (/elettr|luce|presa|quadro|blackout/.test(lower)) {
    steps.push(
      "Controllare interruttori/quadro e alimentazione del punto vendita prima di chiamare elettricista.",
    );
  }
  if (/perdit|acqua|allag|scarico|wc|bagno/.test(lower)) {
    steps.push(
      "Isolare la perdita se sicuro, proteggere merce/pavimento e foto documentare.",
    );
  }
  if (/porta|serratura|infisso|vetro/.test(lower)) {
    steps.push(
      "Mettere in sicurezza l’area e verificare se l’accesso store resta operativo.",
    );
  }
  if (steps.length === 0) {
    steps.push(
      "Confermare sintomi sul posto con store manager e allegare foto/video.",
    );
  }
  steps.push(
    "Assegnare vendor preferred della categoria e chiedere ETA + pezzi necessari.",
  );
  steps.push(
    "Aggiornare il ticket con esito del check — non chiudere senza verifica store.",
  );
  return steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
}

export type ParsedAssistJson = {
  summary: string;
  suggestedSolution: string | null;
};

export function parseOllamaSummaryJson(raw: string): ParsedAssistJson | null {
  const trimmed = raw.trim();
  try {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    const obj = JSON.parse(jsonMatch?.[0] ?? trimmed) as {
      summary?: string;
      suggestedSolution?: string;
      solution?: string;
    };
    const s = String(obj.summary ?? "").trim();
    if (s.length < 8) return null;
    const sol = String(obj.suggestedSolution ?? obj.solution ?? "").trim();
    return {
      summary: s,
      suggestedSolution: sol.length >= 8 ? sol : null,
    };
  } catch {
    return trimmed.length >= 8
      ? { summary: trimmed.slice(0, 2000), suggestedSolution: null }
      : null;
  }
}
