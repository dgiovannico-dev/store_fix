import { afterEach, describe, expect, it } from "vitest";
import { resolvePlatformAiConfig } from "./llm-gateway";

describe("resolvePlatformAiConfig", () => {
  const keys = [
    "AI_BASE_URL",
    "VLLM_BASE_URL",
    "AI_API_KEY",
    "AI_MODEL",
    "OLLAMA_BASE_URL",
    "OLLAMA_MODEL",
  ] as const;
  const prev: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const k of keys) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  function snap() {
    for (const k of keys) {
      prev[k] = process.env[k];
      delete process.env[k];
    }
  }

  it("prefers AI_BASE_URL openai_compatible", () => {
    snap();
    process.env.AI_BASE_URL = "http://127.0.0.1:8000";
    process.env.AI_MODEL = "llama";
    const cfg = resolvePlatformAiConfig();
    expect(cfg?.kind).toBe("openai_compatible");
    expect(cfg?.baseUrl).toBe("http://127.0.0.1:8000/v1");
    expect(cfg?.model).toBe("llama");
  });

  it("falls back to Ollama", () => {
    snap();
    process.env.OLLAMA_BASE_URL = "http://127.0.0.1:11434";
    const cfg = resolvePlatformAiConfig();
    expect(cfg?.kind).toBe("ollama");
    expect(cfg?.sourceLabel).toBe("ollama");
  });

  it("returns null when unset", () => {
    snap();
    expect(resolvePlatformAiConfig()).toBeNull();
  });
});
