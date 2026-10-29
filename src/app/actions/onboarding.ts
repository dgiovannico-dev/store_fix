"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  resumeOnboarding,
  skipOnboarding,
} from "@/domain/onboarding/progress";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { prisma } from "@/infrastructure/db/prisma";

const HQ = new Set(["owner", "admin_hq", "ops_coordinator"]);

async function hqTenant() {
  const session = await auth();
  if (!session?.tenantId || !session.role || !HQ.has(session.role)) {
    return null;
  }
  return session;
}

export async function skipOnboardingAction(): Promise<void> {
  const session = await hqTenant();
  if (!session?.tenantId) return;
  await skipOnboarding(session.tenantId);
  revalidatePath("/onboarding");
  revalidatePath("/app/dashboard");
  redirect("/app/dashboard");
}

export async function resumeOnboardingAction(): Promise<void> {
  const session = await hqTenant();
  if (!session?.tenantId) return;
  await resumeOnboarding(session.tenantId);
  revalidatePath("/onboarding");
  redirect("/onboarding");
}

export async function ensureSlaDefaultsAction(): Promise<void> {
  const session = await hqTenant();
  if (!session?.tenantId) return;
  await ensureDefaultSlaPolicies(prisma, session.tenantId);
  revalidatePath("/onboarding");
}
