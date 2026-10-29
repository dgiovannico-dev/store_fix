import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { suggestTicketCategory } from "@/application/ai/suggest-ticket-category";
import { rejectIfRateLimited } from "@/infrastructure/rate-limit-guard";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { logJson } from "@/infrastructure/log";
import { actionError } from "@/i18n/action-errors";

/**
 * Assist AI categoria (F2-07). Auth richiesta; non scrive ticket.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json({ error: await actionError("unauthorized") }, { status: 401 });
  }

  const limited = await rejectIfRateLimited(
    `ai-suggest:${session.tenantId}:${session.user.id}`,
    RATE_LIMIT.aiSuggest,
  );
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: await actionError("invalidJson") }, { status: 400 });
  }
  const description = String(
    (body as { description?: string }).description ?? "",
  ).trim();
  if (description.length < 5) {
    return NextResponse.json(
      { error: await actionError("descriptionTooShort") },
      { status: 422 },
    );
  }

  const suggestion = await suggestTicketCategory({
    description,
    signal: req.signal,
  });
  logJson("info", "ai.suggest_category", {
    tenantId: session.tenantId,
    source: suggestion.source,
    category: suggestion.category,
  });
  return NextResponse.json({
    ...suggestion,
    needsConfirm: true,
  });
}
