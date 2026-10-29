import { PmEventStatus, Role } from "@prisma/client";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { enqueueEmail } from "@/infrastructure/email/outbox";
import { prisma } from "@/infrastructure/db/prisma";

const DEFAULT_LEAD_HOURS = 48;

/**
 * Promemoria email HQ per visite PM imminenti (F3-05).
 * Idempotente via `remindedAt IS NULL` + chiave outbox.
 */
export async function remindDuePmEvents(
  now = new Date(),
  leadHours = DEFAULT_LEAD_HOURS,
): Promise<{ reminded: number }> {
  const until = new Date(now.getTime() + leadHours * 60 * 60 * 1000);
  const due = await prisma.plannedMaintenanceEvent.findMany({
    where: {
      deletedAt: null,
      status: PmEventStatus.planned,
      remindedAt: null,
      scheduledAt: { gte: now, lte: until },
    },
    include: { store: { select: { name: true } } },
    take: 100,
  });

  let reminded = 0;
  for (const event of due) {
    const claimed = await prisma.plannedMaintenanceEvent.updateMany({
      where: { id: event.id, remindedAt: null },
      data: { remindedAt: now },
    });
    if (claimed.count === 0) continue;

    const memberships = await prisma.membership.findMany({
      where: {
        tenantId: event.tenantId,
        deletedAt: null,
        role: { in: [Role.owner, Role.ops_coordinator] },
      },
      include: { user: { select: { email: true } } },
    });
    const emails = [
      ...new Set(
        memberships.map((m) => m.user.email).filter((e): e is string => !!e),
      ),
    ];

    const when = event.scheduledAt.toISOString();
    const { locale } = await getTenantI18nPrefs(event.tenantId);
    await Promise.all(
      emails.map((to) =>
        enqueueEmail({
          to,
          template: "pm_reminder",
          locale,
          vars: {
            storeName: event.store.name,
            summary: `${event.title} — ${when}`,
            ticketId: event.id,
          },
          idempotencyKey: `pm_reminder:${event.id}:${to}`,
        }),
      ),
    );
    reminded += 1;
  }

  return { reminded };
}
