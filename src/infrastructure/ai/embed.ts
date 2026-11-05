/**
 * Embeddings port — Ollama `/api/embeddings` or OpenAI-compat `/v1/embeddings`.
 * Default model: nomic-embed-text (768-d). Assist only — never SoR.
 */

import {
  resolvePlatformAiConfig,
  type LlmSource,
  type PlatformAiConfig,
} from "./llm-gateway";

export const EMBEDDING_DIM = 768;

export type EmbedResult = {
  vector: number[];
  source: LlmSource;
};

function resolveEmbedConfig(): PlatformAiConfig | null {
  const platform = resolvePlatformAiConfig();
  if (!platform) return null;
  const embedModel =
    process.env.AI_EMBED_MODEL?.trim() ||
    process.env.OLLAMA_EMBED_MODEL?.trim() ||
    "nomic-embed-text";
  return { ...platform, model: embedModel };
}

function parseVector(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length !== EMBEDDING_DIM) return null;
  const out: number[] = [];
  for (const x of raw) {
    const n = typeof x === "number" ? x : Number(x);
    if (!Number.isFinite(n)) return null;
    out.push(n);
  }
  return out;
}

/** Format for pgvector literal / cast. */
export function vectorToSql(v: number[]): string {
  return `[${v.join(",")}]`;
}

export function llmEmbedConfigured(): boolean {
  return resolveEmbedConfig() !== null;
}

export async function llmEmbed(
  text: string,
  signal?: AbortSignal,
): Promise<EmbedResult | null> {
  const cfg = resolveEmbedConfig();
  if (!cfg) return null;
  const input = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  if (!input) return null;

  try {
    if (cfg.kind === "ollama") {
      const res = await fetch(`${cfg.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: cfg.model, prompt: input }),
        signal,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { embedding?: unknown };
      const vector = parseVector(data.embedding);
      return vector ? { vector, source: "ollama" } : null;
    }

    const base = cfg.baseUrl.endsWith("/v1") ? cfg.baseUrl : `${cfg.baseUrl}/v1`;
    const res = await fetch(`${base}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ model: cfg.model, input }),
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      data?: { embedding?: unknown }[];
    };
    const vector = parseVector(data.data?.[0]?.embedding);
    return vector ? { vector, source: cfg.sourceLabel } : null;
  } catch {
    return null;
  }
}
