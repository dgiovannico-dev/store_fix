import { NextResponse } from "next/server";
import { getReadyHealth } from "@/infrastructure/health";

export const dynamic = "force-dynamic";

/**
 * Alias readiness (US-E14-06).
 * Preferire `/api/health/ready` in Compose/proxy; `/api/health/live` per liveness.
 */
export async function GET() {
  const { ok, body } = await getReadyHealth();
  return NextResponse.json(body, { status: ok ? 200 : 503 });
}
