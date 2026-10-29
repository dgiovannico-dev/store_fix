import { prisma } from "@/infrastructure/db/prisma";

/** Ordine sicuro per delete tenant di test (FK SlaPolicy / Onboarding / …). */
export async function cleanupTenant(tenantId: string): Promise<void> {
  await prisma.inviteToken.deleteMany({ where: { tenantId } });
  await prisma.onboardingProgress.deleteMany({ where: { tenantId } });
  await prisma.notification.deleteMany({ where: { tenantId } });
  await prisma.attachment.deleteMany({ where: { tenantId } });
  await prisma.ticketEvent.deleteMany({ where: { tenantId } });
  await prisma.configAuditEvent.deleteMany({ where: { tenantId } });
  await prisma.inboundEmailMessage.deleteMany({ where: { tenantId } });
  await prisma.quoteBid.deleteMany({ where: { tenantId } });
  await prisma.quoteRequest.deleteMany({ where: { tenantId } });
  await prisma.ticket.deleteMany({ where: { tenantId } });
  await prisma.plannedMaintenanceEvent.deleteMany({ where: { tenantId } });
  await prisma.pmSeries.deleteMany({ where: { tenantId } });
  await prisma.vendorContract.deleteMany({ where: { tenantId } });
  await prisma.asset.deleteMany({ where: { tenantId } });
  await prisma.slaPolicy.deleteMany({ where: { tenantId } });
  await prisma.vendor.deleteMany({ where: { tenantId } });
  await prisma.store.deleteMany({ where: { tenantId } });
  await prisma.membership.deleteMany({ where: { tenantId } });
  await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {});
}
