import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { findSimilarTickets } from "@/application/ai/similar-tickets";
import { ForbiddenError } from "@/domain/rbac/guards";
import { rejectIfRateLimited } from "@/infrastructure/rate-limit-guard";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { logJson } from "@/infrastructure/log";
import { actionError } from "@/i18n/action-errors";
import { actionResultError } from "@/i18n/domain-errors";

/** Assist casi simili (F7-08) — sola lettura, needsConfirm. */
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
  const ticketId = String(
    (body as { ticketId?: string }).ticketId ?? "",
  ).trim();
  if (!ticketId) {
    return NextResponse.json(
      { error: await actionError("ticketIdRequired") },
      { status: 422 },
    );
  }

  try {
    const result = await findSimilarTickets({
      tenantId: session.tenantId,
      userId: session.user.id,
      ticketId,
      signal: req.signal,
    });
    logJson("info", "ai.similar_tickets", {
      tenantId: session.tenantId,
      source: result.source,
      count: result.items.length,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return NextResponse.json(
        {
          error: await actionResultError({
            message: e.message,
            code: e.code,
          }),
        },
        { status: 403 },
      );
    }
    throw e;
  }
}
