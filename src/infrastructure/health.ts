import { prisma } from "@/infrastructure/db/prisma";

export type LiveHealth = {
  status: "ok";
  check: "live";
  service: "facilityflow";
  timestamp: string;
};

export type ReadyHealth =
  | {
      status: "ok";
      check: "ready";
      service: "facilityflow";
      db: "up";
      timestamp: string;
    }
  | {
      status: "degraded";
      check: "ready";
      service: "facilityflow";
      db: "down";
      timestamp: string;
    };

/** Liveness: processo risponde — nessuna dipendenza esterna. */
export function getLiveHealth(now = new Date()): LiveHealth {
  return {
    status: "ok",
    check: "live",
    service: "facilityflow",
    timestamp: now.toISOString(),
  };
}

/** Readiness: DB raggiungibile. Nessun secret/PII nel payload. */
export async function getReadyHealth(
  now = new Date(),
): Promise<{ ok: boolean; body: ReadyHealth }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      ok: true,
      body: {
        status: "ok",
        check: "ready",
        service: "facilityflow",
        db: "up",
        timestamp: now.toISOString(),
      },
    };
  } catch {
    return {
      ok: false,
      body: {
        status: "degraded",
        check: "ready",
        service: "facilityflow",
        db: "down",
        timestamp: now.toISOString(),
      },
    };
  }
}
