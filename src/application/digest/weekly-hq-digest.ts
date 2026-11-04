import { Role } from "@prisma/client";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { OPEN_TICKET_STATUSES } from "@/domain/ticket/status";
import { enqueueEmail } from "@/infrastructure/email/outbox";
import { prisma } from "@/infrastructure/db/prisma";
import { t } from "@/i18n";

/**
 * F6-01 — digest settimanale HQ (costi/breach/open).
 */
export async function runWeeklyHqDigest(): Promise<{
  tenants: number;
  emails: number;
}> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const tenants = await prisma.tenant.findMany({
    where: { active: true },
    select: { id: true, name: true },
  });

  let emails = 0;
  for (const tenant of tenants) {
    const [open, breached, costAgg] = await Promise.all([
      prisma.ticket.count({
        where: {
          tenantId: tenant.id,
          deletedAt: null,
          status: { in: [...OPEN_TICKET_STATUSES] },
        },
      }),
      prisma.ticket.count({
        where: {
          tenantId: tenant.id,
          deletedAt: null,
          slaBreachedAt: { not: null, gte: since },
        },
      }),
      prisma.ticket.aggregate({
        where: {
          tenantId: tenant.id,
          deletedAt: null,
          verifiedAt: { gte: since },
        },
        _sum: { actualCost: true, estimatedCost: true },
      }),
    ]);

    const members = await prisma.membership.findMany({
      where: {
        tenantId: tenant.id,
        deletedAt: null,
        role: { in: [Role.owner, Role.admin_hq, Role.ops_coordinator] },
      },
      include: { user: { select: { email: true } } },
    });

    const recipients = [
      ...new Set(
        members.map((m) => m.user.email).filter((e): e is string => Boolean(e)),
      ),
    ];
    if (recipients.length === 0) continue;

    const actual = Number(costAgg._sum.actualCost ?? 0);
    const estimated = Number(costAgg._sum.estimatedCost ?? 0);
    const prefs = await getTenantI18nPrefs(tenant.id);
    const summary = t(prefs.locale)
      .digest.weeklySummary.replace("{open}", String(open))
      .replace("{breached}", String(breached))
      .replace("{actual}", actual.toFixed(2))
      .replace("{estimated}", estimated.toFixed(2));

    const weekKey = since.toISOString().slice(0, 10);
    for (const to of recipients) {
      await enqueueEmail({
        to,
        tenantId: tenant.id,
        template: "pm_reminder",
        locale: prefs.locale,
        vars: {
          storeName: tenant.name,
          summary,
          ticketId: `digest-${weekKey}`,
        },
        idempotencyKey: `digest-weekly:${tenant.id}:${to}:${weekKey}`,
      });
      emails += 1;
    }
  }

  return { tenants: tenants.length, emails };
}
