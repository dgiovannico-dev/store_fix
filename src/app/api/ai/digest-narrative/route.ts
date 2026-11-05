import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateDigestNarrative } from "@/application/ai/digest-narrative";
import { ForbiddenError } from "@/domain/rbac/guards";
import { rejectIfRateLimited } from "@/infrastructure/rate-limit-guard";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { logJson } from "@/infrastructure/log";
import { actionError } from "@/i18n/action-errors";
import { actionResultError } from "@/i18n/domain-errors";

/** A5 — bozza narrativa digest (sola lettura / needsConfirm). */
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

  try {
    const result = await generateDigestNarrative({
      tenantId: session.tenantId,
      userId: session.user.id,
      signal: req.signal,
    });
    logJson("info", "ai.digest_narrative", {
      tenantId: session.tenantId,
      source: result.source,
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
