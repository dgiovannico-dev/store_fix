import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  llmConfigured,
  resolvePlatformAiConfig,
} from "@/infrastructure/ai/llm-gateway";
import { actionError } from "@/i18n/action-errors";

/** F7-02 — ping config AI piattaforma (no secret leakage). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json(
      { error: await actionError("unauthorized") },
      { status: 401 },
    );
  }

  const cfg = resolvePlatformAiConfig();
  if (!cfg || !llmConfigured()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message: await actionError("aiNotConfigured"),
    });
  }

  try {
    if (cfg.kind === "openai_compatible") {
      const res = await fetch(`${cfg.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${cfg.apiKey}` },
        signal: AbortSignal.timeout(4000),
      });
      const models = res.ok
        ? ((await res.json()) as { data?: { id?: string }[] }).data
            ?.map((m) => m.id)
            .filter(Boolean)
            .slice(0, 20)
        : [];
      return NextResponse.json({
        ok: res.ok,
        configured: true,
        kind: cfg.kind,
        source: cfg.sourceLabel,
        model: cfg.model,
        models: models ?? [],
      });
    }

    const res = await fetch(`${cfg.baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(4000),
    });
    return NextResponse.json({
      ok: res.ok,
      configured: true,
      kind: cfg.kind,
      source: cfg.sourceLabel,
      model: cfg.model,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      configured: true,
      kind: cfg.kind,
      source: cfg.sourceLabel,
      model: cfg.model,
      error: await actionError("aiEndpointUnreachable"),
    });
  }
}
