import { describe, expect, it } from "vitest";
import {
  EMBEDDING_DIM,
  localHashEmbed,
  llmEmbed,
  vectorToSql,
} from "./embed";

describe("vectorToSql", () => {
  it("formats pgvector literal", () => {
    const v = Array.from({ length: EMBEDDING_DIM }, (_, i) =>
      i === 0 ? 0.5 : 0,
    );
    const sql = vectorToSql(v);
    expect(sql.startsWith("[")).toBe(true);
    expect(sql.endsWith("]")).toBe(true);
    expect(sql.split(",")).toHaveLength(EMBEDDING_DIM);
  });
});

describe("localHashEmbed", () => {
  it("returns unit-ish 768-d vector", () => {
    const v = localHashEmbed("freddo banco frigo corridoio");
    expect(v).toHaveLength(EMBEDDING_DIM);
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it("is deterministic and similar texts closer than unrelated", () => {
    const a = localHashEmbed("guasto compressore frigo negozio");
    const b = localHashEmbed("frigo compressore guasto punto vendita");
    const c = localHashEmbed("preventivo asfalto parcheggio esterno");
    const cos = (x: number[], y: number[]) =>
      x.reduce((s, xi, i) => s + xi * y[i]!, 0);
    expect(cos(a, b)).toBeGreaterThan(cos(a, c));
  });
});

describe("llmEmbed", () => {
  it("falls back to local_embed when no remote provider", async () => {
    const prev = {
      AI_BASE_URL: process.env.AI_BASE_URL,
      VLLM_BASE_URL: process.env.VLLM_BASE_URL,
      OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    };
    delete process.env.AI_BASE_URL;
    delete process.env.VLLM_BASE_URL;
    delete process.env.OLLAMA_BASE_URL;
    try {
      const r = await llmEmbed("ticket prova HVAC");
      expect(r?.source).toBe("local_embed");
      expect(r?.vector).toHaveLength(EMBEDDING_DIM);
    } finally {
      if (prev.AI_BASE_URL) process.env.AI_BASE_URL = prev.AI_BASE_URL;
      if (prev.VLLM_BASE_URL) process.env.VLLM_BASE_URL = prev.VLLM_BASE_URL;
      if (prev.OLLAMA_BASE_URL)
        process.env.OLLAMA_BASE_URL = prev.OLLAMA_BASE_URL;
    }
  });
});
