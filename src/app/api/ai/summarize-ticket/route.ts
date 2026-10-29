import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { summarizeTicketNotes } from "@/application/ai/summarize-ticket-notes";
import { ForbiddenError } from "@/domain/rbac/guards";
import { checkRateLimit } from "@/infrastructure/rate-limit";
import { logJson } from "@/infrastructure/log";

/** Assist riassunto note (F3-03) — non scrive SoR. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const limit = checkRateLimit(
    `ai-summary:${session.tenantId}:${session.user.id}`,
    20,
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
  const ticketId = String((body as { ticketId?: string }).ticketId ?? "").trim();
  if (!ticketId) {
    return NextResponse.json({ error: "ticketId obbligatorio" }, { status: 422 });
  }

  try {
    const result = await summarizeTicketNotes({
      tenantId: session.tenantId,
      userId: session.user.id,
      ticketId,
      signal: req.signal,
    });
    logJson("info", "ai.summarize_ticket", {
      tenantId: session.tenantId,
      source: result.source,
    });
    return NextResponse.json({ ...result, needsConfirm: true });
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }
}
