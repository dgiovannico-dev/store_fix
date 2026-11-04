import { PmEventStatus, Role } from "@prisma/client";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import {
  appendEmailOutbox,
  kickEmailOutboxDispatch,
} from "@/infrastructure/email/outbox";
import { prisma } from "@/infrastructure/db/prisma";

const DEFAULT_LEAD_HOURS = 48;

/**
 * Promemoria email HQ per visite PM imminenti (F3-05 / F3-09).
 * Idempotente via `remindedAt IS NULL` + chiave outbox (stessa TX).
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
  let queued = false;
  for (const event of due) {
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

    const claimed = await prisma.$transaction(async (tx) => {
      const upd = await tx.plannedMaintenanceEvent.updateMany({
        where: { id: event.id, remindedAt: null },
        data: { remindedAt: now },
      });
      if (upd.count === 0) return false;
      for (const to of emails) {
        await appendEmailOutbox(tx, {
          to,
          template: "pm_reminder",
          locale,
          tenantId: event.tenantId,
          vars: {
            storeName: event.store.name,
            summary: `${event.title} — ${when}`,
            ticketId: event.id,
          },
          idempotencyKey: `pm_reminder:${event.id}:${to}`,
        });
      }
      return true;
    });

    if (!claimed) continue;
    if (emails.length > 0) queued = true;
    reminded += 1;
  }

  if (queued) await kickEmailOutboxDispatch();
  return { reminded };
}
