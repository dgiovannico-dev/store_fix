import { Role, TicketStatus } from "@prisma/client";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { ForbiddenError } from "@/domain/rbac/guards";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

const HEADER = [
  "ticket_id",
  "store_name",
  "vendor_name",
  "category",
  "status",
  "opened_at",
  "verified_at",
  "actual_cost",
  "currency",
] as const;

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCost(n: unknown): string {
  const num = Number(n);
  if (!Number.isFinite(num)) return "";
  return num.toFixed(2);
}

/**
 * Export contabile CSV (F2-05): ticket done/verified con costo.
 * UTF-8, RFC 4180 (comma), importi con punto decimale, currency da prefs tenant.
 * BOM opzionale per Excel Windows (`withBom`).
 */
export async function buildAccountingCsv(input: {
  tenantId: string;
  role: Role;
  from?: Date;
  to?: Date;
  withBom?: boolean;
}): Promise<{ filename: string; body: string; rowCount: number }> {
  requireTenantId(input.tenantId);
  if (!can(input.role, RbacAction.exportAccounting)) {
    throw new ForbiddenError("Export contabile non consentito", "exportAccountingForbidden");
  }

  const from = input.from ?? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const to = input.to ?? new Date();
  const prefs = await getTenantI18nPrefs(input.tenantId);
  const currency = (prefs.currency || "EUR").toUpperCase();

  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId: input.tenantId,
      deletedAt: null,
      status: { in: [TicketStatus.done, TicketStatus.verified] },
      actualCost: { not: null },
      OR: [
        { verifiedAt: { gte: from, lte: to } },
        {
          AND: [
            { verifiedAt: null },
            { doneAt: { gte: from, lte: to } },
          ],
        },
      ],
    },
    include: {
      store: { select: { name: true } },
      vendor: { select: { name: true } },
    },
    orderBy: [{ verifiedAt: "desc" }, { doneAt: "desc" }],
  });

  const lines = [
    HEADER.join(","),
    ...tickets.map((t) =>
      [
        csvEscape(t.id),
        csvEscape(t.store.name),
        csvEscape(t.vendor?.name ?? ""),
        csvEscape(t.category),
        csvEscape(t.status),
        csvEscape(t.openedAt.toISOString()),
        csvEscape(t.verifiedAt?.toISOString() ?? ""),
        csvEscape(formatCost(t.actualCost)),
        currency,
      ].join(","),
    ),
  ];

  const csv = lines.join("\r\n") + "\r\n";
  const body = input.withBom ? `\uFEFF${csv}` : csv;
  const stamp = to.toISOString().slice(0, 10);
  return {
    filename: `facilityflow-accounting-${stamp}.csv`,
    body,
    rowCount: tickets.length,
  };
}
