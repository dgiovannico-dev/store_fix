import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { exportTenantGdpr } from "@/application/gdpr/export-tenant";
import { ForbiddenError } from "@/domain/rbac/guards";
import { logJson } from "@/infrastructure/log";
import { actionError } from "@/i18n/action-errors";
import { actionResultError } from "@/i18n/domain-errors";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.tenantId || !session.role) {
    return NextResponse.json({ error: await actionError("unauthorized") }, { status: 401 });
  }

  const requestId =
    req.headers.get("x-request-id") ?? crypto.randomUUID();

  try {
    const payload = await exportTenantGdpr({
      tenantId: session.tenantId,
      role: session.role,
    });
    logJson("info", "gdpr.export", {
      requestId,
      tenantId: session.tenantId,
      role: session.role,
    });
    return NextResponse.json(payload, {
      headers: {
        "Content-Disposition": `attachment; filename="facilityflow-gdpr-${session.tenantId}.json"`,
        "X-Request-Id": requestId,
      },
    });
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return NextResponse.json(
        { error: await actionResultError({ message: e.message, code: e.code }) },
        { status: 403 },
      );
    }
    logJson("error", "gdpr.export.fail", { requestId, err: String(e) });
    return NextResponse.json({ error: await actionError("exportFailed") }, { status: 500 });
  }
}
