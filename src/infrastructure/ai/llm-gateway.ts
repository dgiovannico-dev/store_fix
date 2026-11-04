/**
 * LlmGateway (F7-01) — OpenAI-compatible default (vLLM) + Ollama legacy.
 * Assist only — never System of Record.
 */

export type LlmProviderKind =
  | "openai_compatible"
  | "ollama"
  | "none";

export type LlmSource =
  | "vllm"
  | "openai_compatible"
  | "ollama"
  | "heuristic";

export type PlatformAiConfig = {
  kind: LlmProviderKind;
  baseUrl: string;
  apiKey: string;
  model: string;
  sourceLabel: LlmSource;
};

export function resolvePlatformAiConfig(): PlatformAiConfig | null {
  const openaiBase =
    process.env.AI_BASE_URL?.trim() ||
    process.env.VLLM_BASE_URL?.trim() ||
    "";
  if (openaiBase) {
    const base = openaiBase.replace(/\/$/, "");
    const withV1 = base.endsWith("/v1") ? base : `${base}/v1`;
    return {
      kind: "openai_compatible",
      baseUrl: withV1,
      apiKey:
        process.env.AI_API_KEY?.trim() ||
        process.env.VLLM_API_KEY?.trim() ||
        "local",
      model:
        process.env.AI_MODEL?.trim() ||
        process.env.VLLM_MODEL?.trim() ||
        "default",
      sourceLabel: process.env.VLLM_BASE_URL ? "vllm" : "openai_compatible",
    };
  }

  const ollama = process.env.OLLAMA_BASE_URL?.trim();
  if (ollama) {
    return {
      kind: "ollama",
      baseUrl: ollama.replace(/\/$/, ""),
      apiKey: "",
      model: process.env.OLLAMA_MODEL?.trim() || "llama3.2",
      sourceLabel: "ollama",
    };
  }

  return null;
}

export function llmConfigured(): boolean {
  return resolvePlatformAiConfig() !== null;
}

export async function llmChatJson(input: {
  system: string;
  user: string;
  signal?: AbortSignal;
  /** Optional tenant override (BYOK). */
  override?: Partial<PlatformAiConfig> | null;
}): Promise<{ content: string; source: LlmSource } | null> {
  const platform = resolvePlatformAiConfig();
  const cfg: PlatformAiConfig | null = input.override?.baseUrl
    ? {
        kind: input.override.kind ?? "openai_compatible",
        baseUrl: input.override.baseUrl.replace(/\/$/, ""),
        apiKey: input.override.apiKey ?? "local",
        model: input.override.model ?? "default",
        sourceLabel: input.override.sourceLabel ?? "openai_compatible",
      }
    : platform;
  if (!cfg) return null;

  if (cfg.kind === "ollama") {
    const res = await fetch(`${cfg.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: cfg.model,
        stream: false,
        format: "json",
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
      }),
      signal: input.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { message?: { content?: string } };
    const content = data.message?.content?.trim();
    return content ? { content, source: "ollama" } : null;
  }

  const base = cfg.baseUrl.endsWith("/v1") ? cfg.baseUrl : `${cfg.baseUrl}/v1`;
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
    signal: input.signal,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  return content ? { content, source: cfg.sourceLabel } : null;
}

/** @deprecated use llmConfigured */
export function ollamaConfigured(): boolean {
  return llmConfigured();
}

/** @deprecated use llmChatJson */
export async function ollamaChatJson(input: {
  system: string;
  user: string;
  signal?: AbortSignal;
}): Promise<string | null> {
  const r = await llmChatJson(input);
  return r?.content ?? null;
}
