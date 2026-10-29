import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { suggestTicketVendor } from "@/application/ai/suggest-ticket-vendor";
import { ForbiddenError } from "@/domain/rbac/guards";
import { checkRateLimitPolicyAsync } from "@/infrastructure/rate-limit-async";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { tooManyRequestsFromLimit } from "@/infrastructure/rate-limit-response";
import { logJson } from "@/infrastructure/log";
import { actionError } from "@/i18n/action-errors";
import { actionResultError } from "@/i18n/domain-errors";

/** Assist vendor (F2-07) — heuristic; conferma umana obbligatoria in UI. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json({ error: await actionError("unauthorized") }, { status: 401 });
  }

  const limit = await checkRateLimitPolicyAsync(
    `ai-suggest:${session.tenantId}:${session.user.id}`,
    RATE_LIMIT.aiSuggest,
  );
  if (!limit.ok) {
    return tooManyRequestsFromLimit(await actionError("tooManyRequests"), limit);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: await actionError("invalidJson") }, { status: 400 });
  }
  const b = body as { storeId?: string; category?: string };
  const storeId = String(b.storeId ?? "").trim();
  const category = String(b.category ?? "").trim();
  if (!storeId || !category) {
    return NextResponse.json(
      { error: await actionError("storeIdCategoryRequired") },
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
      return NextResponse.json(
        { error: await actionResultError({ message: e.message, code: e.code }) },
        { status: 403 },
      );
    }
    throw e;
  }
}
