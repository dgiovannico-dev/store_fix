import { Role } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";
import { countActiveDefaultSla } from "@/domain/sla/defaults";

export type OnboardingStepId =
  | "stores"
  | "vendors"
  | "sla"
  | "invite_sm"
  | "sample_ticket";

export type OnboardingStep = {
  id: OnboardingStepId;
  done: boolean;
  href: string;
  /** S1: ticket prova skippato / non ancora SoR */
  blocked?: boolean;
};

export type OnboardingSnapshot = {
  tenantId: string;
  steps: OnboardingStep[];
  doneCount: number;
  totalCount: number;
  networkComplete: boolean;
  skippedAt: Date | null;
  sampleTicketSkipped: boolean;
};

async function ensureProgressRow(tenantId: string) {
  return prisma.onboardingProgress.upsert({
    where: { tenantId },
    create: { tenantId, sampleTicketSkipped: true },
    update: {},
  });
}

export async function getOnboardingSnapshot(
  tenantId: string,
): Promise<OnboardingSnapshot> {
  requireTenantId(tenantId);
  const progress = await ensureProgressRow(tenantId);

  const [storeCount, vendorCount, slaCount, smCount] = await Promise.all([
    prisma.store.count({ where: { tenantId, deletedAt: null } }),
    prisma.vendor.count({ where: { tenantId, deletedAt: null } }),
    countActiveDefaultSla(prisma, tenantId),
    prisma.membership.count({
      where: {
        tenantId,
        role: Role.store_manager,
        deletedAt: null,
      },
    }),
  ]);

  const steps: OnboardingStep[] = [
    {
      id: "stores",
      done: storeCount > 0,
      href: "/app/stores",
    },
    {
      id: "vendors",
      done: vendorCount > 0,
      href: "/app/vendors",
    },
    {
      id: "sla",
      done: slaCount >= 3,
      href: "/onboarding",
    },
    {
      id: "invite_sm",
      done: smCount > 0,
      href: "/app/settings/members",
    },
    {
      id: "sample_ticket",
      done: progress.sampleTicketSkipped,
      href: "/onboarding",
      blocked: true,
    },
  ];

  const networkSteps = steps.filter((s) => s.id !== "sample_ticket");
  const doneCount = networkSteps.filter((s) => s.done).length;
  const networkComplete = networkSteps.every((s) => s.done);

  return {
    tenantId,
    steps,
    doneCount,
    totalCount: networkSteps.length,
    networkComplete,
    skippedAt: progress.skippedAt,
    sampleTicketSkipped: progress.sampleTicketSkipped,
  };
}

export async function skipOnboarding(tenantId: string): Promise<void> {
  requireTenantId(tenantId);
  await prisma.onboardingProgress.upsert({
    where: { tenantId },
    create: {
      tenantId,
      skippedAt: new Date(),
      sampleTicketSkipped: true,
    },
    update: { skippedAt: new Date() },
  });
}

export async function resumeOnboarding(tenantId: string): Promise<void> {
  requireTenantId(tenantId);
  await prisma.onboardingProgress.updateMany({
    where: { tenantId },
    data: { skippedAt: null },
  });
}
