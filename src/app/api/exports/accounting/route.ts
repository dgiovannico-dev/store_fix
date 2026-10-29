import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildAccountingCsv } from "@/application/exports/accounting-csv";
import { ForbiddenError } from "@/domain/rbac/guards";
import { logJson } from "@/infrastructure/log";
import { rejectIfRateLimited } from "@/infrastructure/rate-limit-guard";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { actionError } from "@/i18n/action-errors";
import { actionResultError } from "@/i18n/domain-errors";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    return NextResponse.json({ error: await actionError("unauthorized") }, { status: 401 });
  }

  const url = new URL(req.url);
  const withBom = url.searchParams.get("bom") !== "0";
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  const limited = await rejectIfRateLimited(
    `accounting-export:${session.tenantId}:${session.user.id}`,
    RATE_LIMIT.accountingExport,
  );
  if (limited) return limited;

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
      return NextResponse.json(
        { error: await actionResultError({ message: e.message, code: e.code }) },
        { status: 403 },
      );
    }
    logJson("error", "export.accounting.fail", { requestId, err: String(e) });
    return NextResponse.json({ error: await actionError("exportFailed") }, { status: 500 });
  }
}
