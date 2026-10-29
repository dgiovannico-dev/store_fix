export type NotesSummary = {
  summary: string;
  source: "heuristic" | "ollama";
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
    picked.some((p) => s.startsWith(p.slice(0, 40)) || p.startsWith(s.slice(0, 40))),
  );
  const bullets = (ordered.length ? ordered : picked).slice(0, maxBullets);

  if (bullets.length === 0) {
    return {
      summary: normalized.slice(0, 240) + (normalized.length > 240 ? "…" : ""),
      source: "heuristic",
      bulletCount: 1,
    };
  }

  return {
    summary: bullets.map((b) => `• ${b}`).join("\n"),
    source: "heuristic",
    bulletCount: bullets.length,
  };
}

export function parseOllamaSummaryJson(raw: string): string | null {
  const trimmed = raw.trim();
  try {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    const obj = JSON.parse(jsonMatch?.[0] ?? trimmed) as {
      summary?: string;
    };
    const s = String(obj.summary ?? "").trim();
    return s.length >= 8 ? s : null;
  } catch {
    return trimmed.length >= 8 ? trimmed.slice(0, 2000) : null;
  }
}
