import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

export async function countUnreadNotifications(
  tenantId: string,
  userId: string,
): Promise<number> {
  requireTenantId(tenantId);
  return prisma.notification.count({
    where: {
      tenantId,
      userId,
      readAt: null,
      deletedAt: null,
    },
  });
}

export async function listNotificationsForUser(input: {
  tenantId: string;
  userId: string;
  take?: number;
}) {
  requireTenantId(input.tenantId);
  return prisma.notification.findMany({
    where: {
      tenantId: input.tenantId,
      userId: input.userId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    take: input.take ?? 30,
  });
}

export async function markNotificationRead(input: {
  tenantId: string;
  userId: string;
  notificationId: string;
}) {
  requireTenantId(input.tenantId);
  const row = await prisma.notification.findFirst({
    where: {
      id: input.notificationId,
      tenantId: input.tenantId,
      userId: input.userId,
      deletedAt: null,
    },
  });
  if (!row) return { ok: false as const, message: "Notifica non trovata", code: "notificationNotFound" };
  await prisma.notification.update({
    where: { id: row.id },
    data: { readAt: new Date() },
  });
  return { ok: true as const };
}

export async function markAllNotificationsRead(input: {
  tenantId: string;
  userId: string;
}) {
  requireTenantId(input.tenantId);
  await prisma.notification.updateMany({
    where: {
      tenantId: input.tenantId,
      userId: input.userId,
      readAt: null,
      deletedAt: null,
    },
    data: { readAt: new Date() },
  });
  return { ok: true as const };
}
