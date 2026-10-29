import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { exportTenantGdpr } from "@/application/gdpr/export-tenant";
import { ForbiddenError } from "@/domain/rbac/guards";
import { logJson } from "@/infrastructure/log";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.tenantId || !session.role) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
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
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    logJson("error", "gdpr.export.fail", { requestId, err: String(e) });
    return NextResponse.json({ error: "Export fallito" }, { status: 500 });
  }
}
