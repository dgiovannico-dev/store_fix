import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { suggestTicketPriority } from "@/application/ai/suggest-ticket-priority";
import { rejectIfRateLimited } from "@/infrastructure/rate-limit-guard";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { logJson } from "@/infrastructure/log";
import { actionError } from "@/i18n/action-errors";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json(
      { error: await actionError("unauthorized") },
      { status: 401 },
    );
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
    return NextResponse.json(
      { error: await actionError("invalidJson") },
      { status: 400 },
    );
  }
  const description = String(
    (body as { description?: string }).description ?? "",
  ).trim();
  const category = (body as { category?: string }).category;
  if (description.length < 5) {
    return NextResponse.json(
      { error: await actionError("descriptionTooShort") },
      { status: 422 },
    );
  }

  const suggestion = await suggestTicketPriority({
    description,
    category,
    signal: req.signal,
    audit: {
      tenantId: session.tenantId,
      userId: session.user.id,
      feature: "suggest_priority",
    },
  });
  logJson("info", "ai.suggest_priority", {
    tenantId: session.tenantId,
    source: suggestion.source,
    priority: suggestion.priority,
  });
  return NextResponse.json({ ...suggestion, needsConfirm: true });
}
