import { Role } from "@prisma/client";
import { digestWeekKey } from "@/application/digest/week-key";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { OPEN_TICKET_STATUSES } from "@/domain/ticket/status";
import { enqueueEmail } from "@/infrastructure/email/outbox";
import { prisma } from "@/infrastructure/db/prisma";
import { digestAckDeepLink, ticketDeepLink } from "@/lib/app-urls";
import { t } from "@/i18n";

/**
 * F6-01 + F9-01 — digest settimanale HQ con deep link top ticket + CTA Segna rivisto.
 */
export async function runWeeklyHqDigest(): Promise<{
  tenants: number;
  emails: number;
}> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekKey = digestWeekKey();
  const tenants = await prisma.tenant.findMany({
    where: { active: true },
    select: { id: true, name: true },
  });

  let emails = 0;
  for (const tenant of tenants) {
    const [open, breached, costAgg, topTickets] = await Promise.all([
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
      prisma.ticket.findMany({
        where: {
          tenantId: tenant.id,
          deletedAt: null,
          OR: [
            { slaBreachedAt: { not: null, gte: since } },
            { status: { in: [...OPEN_TICKET_STATUSES] } },
          ],
        },
        orderBy: [{ slaBreachedAt: "desc" }, { openedAt: "desc" }],
        take: 3,
        select: {
          id: true,
          description: true,
          store: { select: { name: true, city: true } },
        },
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
    const copy = t(prefs.locale).digest;
    const summaryStats = copy.weeklySummary
      .replace("{open}", String(open))
      .replace("{breached}", String(breached))
      .replace("{actual}", actual.toFixed(2))
      .replace("{estimated}", estimated.toFixed(2));

    const linksHtml =
      topTickets.length === 0
        ? `<p>${copy.noHotTickets}</p>`
        : `<ul>${topTickets
            .map((tk) => {
              const label =
                (tk.store.city ?? tk.store.name) +
                " — " +
                tk.description.slice(0, 60).replace(/</g, "");
              const href = ticketDeepLink(tk.id);
              return `<li><a href="${href}">${label}…</a></li>`;
            })
            .join("")}</ul>`;

    const linksText =
      topTickets.length === 0
        ? copy.noHotTickets
        : topTickets
            .map((tk) => `- ${ticketDeepLink(tk.id)}`)
            .join("\n");

    const ackUrl = digestAckDeepLink(weekKey);

    for (const to of recipients) {
      await enqueueEmail({
        to,
        tenantId: tenant.id,
        template: "hq_digest",
        locale: prefs.locale,
        vars: {
          storeName: tenant.name,
          summary: `${summaryStats}\n\n${linksText}`,
          summaryHtml: `<p>${summaryStats}</p>${linksHtml}`,
          ackUrl,
          ticketId: `digest-${weekKey}`,
        },
        idempotencyKey: `digest-weekly:${tenant.id}:${to}:${weekKey}`,
      });
      emails += 1;
    }
  }

  return { tenants: tenants.length, emails };
}
