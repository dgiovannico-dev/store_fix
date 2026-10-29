import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { suggestTicketVendor } from "@/application/ai/suggest-ticket-vendor";
import { ForbiddenError } from "@/domain/rbac/guards";
import { checkRateLimit } from "@/infrastructure/rate-limit";
import { logJson } from "@/infrastructure/log";

/** Assist vendor (F2-07) — heuristic; conferma umana obbligatoria in UI. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const limit = checkRateLimit(
    `ai-vendor:${session.tenantId}:${session.user.id}`,
    30,
    60_000,
  );
  if (!limit.ok) {
    return NextResponse.json({ error: "Troppe richieste" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON non valido" }, { status: 400 });
  }
  const b = body as { storeId?: string; category?: string };
  const storeId = String(b.storeId ?? "").trim();
  const category = String(b.category ?? "").trim();
  if (!storeId || !category) {
    return NextResponse.json(
      { error: "storeId e category obbligatori" },
      { status: 422 },
    );
  }

  try {
    const suggestion = await suggestTicketVendor({
      tenantId: session.tenantId,
      userId: session.user.id,
      storeId,
      category,
    });
    logJson("info", "ai.suggest_vendor", {
      tenantId: session.tenantId,
      source: suggestion?.source ?? "none",
    });
    return NextResponse.json({
      suggestion,
      needsConfirm: true,
    });
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }
}
