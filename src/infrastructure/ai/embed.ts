/**
 * Embeddings port — prefer OpenAI-compat `/v1/embeddings` (vLLM), then Ollama,
 * then deterministic local CPU vector (no second model required).
 * Schema dim: 768 (nomic-embed-text / local). Assist only — never SoR.
 */

import {
  resolvePlatformAiConfig,
  type LlmSource,
  type PlatformAiConfig,
} from "./llm-gateway";

export const EMBEDDING_DIM = 768;

export type EmbedResult = {
  vector: number[];
  source: LlmSource | "local_embed";
};

function resolveEmbedConfig(): PlatformAiConfig | null {
  const platform = resolvePlatformAiConfig();
  if (!platform) return null;
  const embedModel =
    process.env.AI_EMBED_MODEL?.trim() ||
    process.env.OLLAMA_EMBED_MODEL?.trim() ||
    // Same chat model id if the server exposes /v1/embeddings; else local fallback
    platform.model;
  return { ...platform, model: embedModel };
}

function parseVector(raw: unknown, expectedDim = EMBEDDING_DIM): number[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  // Accept native model dims; pad/truncate to schema 768 for pgvector column
  const out: number[] = [];
  for (let i = 0; i < expectedDim; i++) {
    const x = raw[i];
    const n = typeof x === "number" ? x : Number(x);
    out.push(Number.isFinite(n) ? n : 0);
  }
  return out;
}

/** Deterministic bag-of-tokens → unit vector (CPU, no LLM). */
export function localHashEmbed(text: string): number[] {
  const vec = new Float64Array(EMBEDDING_DIM);
  const tokens = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .slice(0, 256);

  const bump = (tok: string, weight: number) => {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = (h >>> 0) % EMBEDDING_DIM;
    vec[idx]! += weight;
    const idx2 = ((h >>> 8) ^ tok.length * 31) % EMBEDDING_DIM;
    vec[idx2]! += weight * 0.5;
  };

  for (const tok of tokens) {
    bump(tok, 1);
    if (tok.length >= 4) bump(tok.slice(0, 3), 0.35);
  }

  let sumSq = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) sumSq += vec[i]! * vec[i]!;
  const norm = Math.sqrt(sumSq) || 1;
  const out: number[] = new Array(EMBEDDING_DIM);
  for (let i = 0; i < EMBEDDING_DIM; i++) out[i] = vec[i]! / norm;
  return out;
}

/** Format for pgvector literal / cast. */
export function vectorToSql(v: number[]): string {
  return `[${v.join(",")}]`;
}

export function llmEmbedConfigured(): boolean {
  // Local embed always available — RAG indexing never hard-depends on Ollama
  return true;
}

export async function llmEmbed(
  text: string,
  signal?: AbortSignal,
): Promise<EmbedResult | null> {
  const input = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  if (!input) return null;

  const cfg = resolveEmbedConfig();
  if (cfg) {
    try {
      if (cfg.kind === "ollama") {
        const res = await fetch(`${cfg.baseUrl}/api/embeddings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: cfg.model, prompt: input }),
          signal,
        });
        if (res.ok) {
          const data = (await res.json()) as { embedding?: unknown };
          const vector = parseVector(data.embedding);
          if (vector) return { vector, source: "ollama" };
        }
      } else {
        const base = cfg.baseUrl.endsWith("/v1")
          ? cfg.baseUrl
          : `${cfg.baseUrl}/v1`;
        const res = await fetch(`${base}/embeddings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify({ model: cfg.model, input }),
          signal,
        });
        if (res.ok) {
          const data = (await res.json()) as {
            data?: { embedding?: unknown }[];
          };
          const vector = parseVector(data.data?.[0]?.embedding);
          if (vector) return { vector, source: cfg.sourceLabel };
        }
      }
    } catch {
      // fall through to local
    }
  }

  return { vector: localHashEmbed(input), source: "local_embed" };
}
