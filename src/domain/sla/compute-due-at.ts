import { TicketPriority } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { DEFAULT_SLA_POLICIES } from "./defaults";

/**
 * slaDueAt = openedAt + resolutionHours (clock da open).
 * Timezone store usata per interpretare openedAt locale → Instant UTC in DB.
 * (T2.8 / US-E05-01)
 */
export function addHoursInTimezone(
  openedAt: Date,
  resolutionHours: number,
  _timezone: string,
): Date {
  // Instant arithmetic: resolutionHours wall-clock; TZ usata per display/AC test.
  // Per MVP Italia (Europe/Rome) DST: usiamo offset fixed hours su Instant —
  // sufficiente per “4h/24h/72h” operativi; calendar TZ-aware = Fase 2 se richiesto.
  void _timezone;
  return new Date(openedAt.getTime() + resolutionHours * 60 * 60 * 1000);
}

export async function resolveResolutionHours(input: {
  tenantId: string;
  category: string;
  priority: TicketPriority;
}): Promise<{ hours: number; source: "policy" | "fallback" }> {
  const policy = await prisma.slaPolicy.findFirst({
    where: {
      tenantId: input.tenantId,
      category: input.category,
      priority: input.priority,
      deletedAt: null,
    },
  });
  if (policy) return { hours: policy.resolutionHours, source: "policy" };

  const fallback = DEFAULT_SLA_POLICIES.find(
    (d) => d.category === input.category && d.priority === input.priority,
  );
  if (fallback) return { hours: fallback.resolutionHours, source: "fallback" };

  // Ultimo fallback: normal 72h
  return { hours: 72, source: "fallback" };
}

export async function computeSlaDueAt(input: {
  tenantId: string;
  category: string;
  priority: TicketPriority;
  openedAt: Date;
  storeTimezone: string;
}): Promise<{ slaDueAt: Date; resolutionHours: number; source: string }> {
  const { hours, source } = await resolveResolutionHours(input);
  const slaDueAt = addHoursInTimezone(
    input.openedAt,
    hours,
    input.storeTimezone,
  );
  return { slaDueAt, resolutionHours: hours, source };
}
