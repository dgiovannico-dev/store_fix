import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listMembershipConfigAudit } from "@/application/memberships/membership-service";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { actionError } from "@/i18n/action-errors";

/** F9-07 — DPO audit export CSV/JSON. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.tenantId || !session.role) {
    return NextResponse.json(
      { error: await actionError("accessRequired") },
      { status: 401 },
    );
  }
  if (!can(session.role, RbacAction.viewConfigAudit)) {
    return NextResponse.json(
      { error: await actionError("accessRequired") },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "json";
  const events = await listMembershipConfigAudit({
    tenantId: session.tenantId,
    role: session.role,
    take: 500,
  });

  if (format === "csv") {
    const lines = [
      "id,type,actorUserId,membershipId,createdAt",
      ...events.map(
        (e) =>
          `${e.id},${e.type},${e.actorUserId ?? ""},${e.membershipId ?? ""},${e.createdAt.toISOString()}`,
      ),
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="config-audit.csv"',
      },
    });
  }

  return new NextResponse(JSON.stringify(events, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="config-audit.json"',
    },
  });
}
