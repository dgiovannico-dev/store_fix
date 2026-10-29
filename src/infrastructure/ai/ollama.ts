/**
 * Client Ollama locale (F2-07). Disabilitato se OLLAMA_BASE_URL assente.
 * Mai usato come System of Record.
 */

export function ollamaConfigured(): boolean {
  return Boolean(process.env.OLLAMA_BASE_URL?.trim());
}

export async function ollamaChatJson(input: {
  system: string;
  user: string;
  signal?: AbortSignal;
}): Promise<string | null> {
  const base = process.env.OLLAMA_BASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  const model = process.env.OLLAMA_MODEL?.trim() || "llama3.2";

  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
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
  const data = (await res.json()) as {
    message?: { content?: string };
  };
  return data.message?.content?.trim() || null;
}
