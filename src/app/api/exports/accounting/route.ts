import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildAccountingCsv } from "@/application/exports/accounting-csv";
import { ForbiddenError } from "@/domain/rbac/guards";
import { logJson } from "@/infrastructure/log";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.tenantId || !session.role) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const url = new URL(req.url);
  const withBom = url.searchParams.get("bom") !== "0";
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  try {
    const file = await buildAccountingCsv({
      tenantId: session.tenantId,
      role: session.role,
      withBom,
    });
    logJson("info", "export.accounting", {
      requestId,
      tenantId: session.tenantId,
      rows: file.rowCount,
    });
    return new NextResponse(file.body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "X-Request-Id": requestId,
      },
    });
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    logJson("error", "export.accounting.fail", { requestId, err: String(e) });
    return NextResponse.json({ error: "Export fallito" }, { status: 500 });
  }
}
