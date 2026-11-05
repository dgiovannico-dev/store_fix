import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { draftOpsMessage } from "@/application/ai/draft-ops-message";
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
  const ticketId = String((body as { ticketId?: string }).ticketId ?? "").trim();
  const audience = (body as { audience?: "vendor" | "store" }).audience;
  if (!ticketId) {
    return NextResponse.json(
      { error: await actionError("ticketIdRequired") },
      { status: 422 },
    );
  }
  if (audience !== "vendor" && audience !== "store") {
    return NextResponse.json(
      { error: await actionError("invalidJson") },
      { status: 422 },
    );
  }

  try {
    const result = await draftOpsMessage({
      tenantId: session.tenantId,
      userId: session.user.id,
      ticketId,
      audience,
      signal: req.signal,
    });
    logJson("info", "ai.draft_message", {
      tenantId: session.tenantId,
      source: result.source,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: await actionError("accessRequired") },
      { status: 403 },
    );
  }
}
