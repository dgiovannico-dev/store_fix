import { NextResponse } from "next/server";
import { processInboundEmail } from "@/application/email-inbound/process-inbound";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { checkRateLimitPolicy } from "@/infrastructure/rate-limit";
import { tooManyRequestsFromLimit } from "@/infrastructure/rate-limit-response";
import { logJson } from "@/infrastructure/log";
import { rateLimitKey } from "@/infrastructure/security/client-ip";
import { actionError } from "@/i18n/action-errors";
import { actionResultError } from "@/i18n/domain-errors";

/**
 * Webhook inbound email → ticket (F2-08).
 * Auth: `Authorization: Bearer $INBOUND_EMAIL_WEBHOOK_SECRET`
 * Body JSON: { messageId, subject, text, from?, tenantSlug|tenantId }
 */
export async function POST(req: Request) {
  const secret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: await actionError("inboundEmailNotConfigured") },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token !== secret) {
    return NextResponse.json({ error: await actionError("unauthorized") }, { status: 401 });
  }

  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const limit = checkRateLimitPolicy(
    rateLimitKey("inbound-email", req.headers),
    RATE_LIMIT.inboundEmail,
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

  const b = body as Record<string, unknown>;
  const result = await processInboundEmail({
    messageId: String(b.messageId ?? ""),
    subject: String(b.subject ?? ""),
    text: String(b.text ?? b.body ?? ""),
    from: b.from ? String(b.from) : undefined,
    tenantId: b.tenantId ? String(b.tenantId) : undefined,
    tenantSlug: b.tenantSlug ? String(b.tenantSlug) : undefined,
  });

  if (!result.ok) {
    const error = await actionResultError(result);
    logJson("warn", "inbound.email.reject", {
      requestId,
      code: result.code,
      error,
    });
    return NextResponse.json({ error, code: result.code }, { status: 422 });
  }

  logJson("info", "inbound.email.ok", {
    requestId,
    ticketId: result.ticketId,
    duplicate: !!result.duplicate,
  });
  return NextResponse.json(
    { ticketId: result.ticketId, duplicate: !!result.duplicate },
    { status: result.duplicate ? 200 : 201 },
  );
}
