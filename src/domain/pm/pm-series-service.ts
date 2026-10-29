import { PmEventStatus, type Role } from "@prisma/client";
import { z } from "zod";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCanMutate } from "@/domain/rbac/guards";
import { expandRruleOccurrences, rrulePreset } from "@/domain/pm/expand-rrule";
import { prisma } from "@/infrastructure/db/prisma";
import {
  requireTenantId,
  tenantActiveWhere,
} from "@/infrastructure/db/tenant-scope";
import { canManagePm } from "./pm-event-service";

const optionalId = z
  .union([z.string().min(1), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v === "" || v == null ? null : v));

export const pmSeriesInputSchema = z.object({
  storeId: z.string().min(1),
  title: z.string().trim().min(2).max(200),
  dtstart: z.coerce.date(),
  recurrence: z.enum(["weekly", "monthly", "quarterly"]),
  vendorId: optionalId,
  vendorContractId: optionalId,
  assetId: optionalId,
  until: z.coerce.date().optional().nullable(),
});

/**
 * Crea serie RRULE e materializza occorrenze nell'orizzonte (F3-05).
 */
export async function createPmSeries(input: {
  tenantId: string;
  role: Role;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.managePmCalendar);
  if (!canManagePm(input.role)) {
    return { ok: false as const, message: "Calendario PM non consentito" };
  }

  const parsed = pmSeriesInputSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, message: "Dati serie PM non validi" };
  }

  const store = await prisma.store.findFirst({
    where: { id: parsed.data.storeId, ...tenantActiveWhere(input.tenantId) },
  });
  if (!store) return { ok: false as const, message: "Punto vendita non valido" };

  if (parsed.data.vendorId) {
    const v = await prisma.vendor.findFirst({
      where: {
        id: parsed.data.vendorId,
        ...tenantActiveWhere(input.tenantId),
      },
    });
    if (!v) return { ok: false as const, message: "Fornitore non valido" };
  }

  const rule = rrulePreset(parsed.data.recurrence);
  const series = await prisma.pmSeries.create({
    data: {
      tenantId: input.tenantId,
      storeId: parsed.data.storeId,
      title: parsed.data.title,
      rrule: rule,
      dtstart: parsed.data.dtstart,
      until: parsed.data.until ?? null,
      vendorId: parsed.data.vendorId,
      vendorContractId: parsed.data.vendorContractId,
      assetId: parsed.data.assetId,
    },
  });

  const created = await materializeSeriesOccurrences(series.id);
  return { ok: true as const, series, created };
}

/** Espande tutte le serie attive (job worker). */
export async function expandAllPmSeries(now = new Date()): Promise<{
  series: number;
  created: number;
}> {
  const seriesList = await prisma.pmSeries.findMany({
    where: { deletedAt: null },
    take: 200,
  });
  let created = 0;
  for (const s of seriesList) {
    created += await materializeSeriesOccurrences(s.id, now);
  }
  return { series: seriesList.length, created };
}

export async function materializeSeriesOccurrences(
  seriesId: string,
  now = new Date(),
): Promise<number> {
  const series = await prisma.pmSeries.findFirst({
    where: { id: seriesId, deletedAt: null },
  });
  if (!series) return 0;

  const to = new Date(
    now.getTime() + series.generateAheadDays * 24 * 60 * 60 * 1000,
  );
  const from = new Date(Math.min(series.dtstart.getTime(), now.getTime()));
  const dates = expandRruleOccurrences({
    rrule: series.rrule,
    dtstart: series.dtstart,
    until: series.until,
    from,
    to,
  });

  let created = 0;
  for (const scheduledAt of dates) {
    try {
      await prisma.plannedMaintenanceEvent.create({
        data: {
          tenantId: series.tenantId,
          storeId: series.storeId,
          vendorId: series.vendorId,
          vendorContractId: series.vendorContractId,
          assetId: series.assetId,
          seriesId: series.id,
          title: series.title,
          scheduledAt,
          status: PmEventStatus.planned,
        },
      });
      created += 1;
    } catch {
      // unique (seriesId, scheduledAt) → già presente
    }
  }
  return created;
}
