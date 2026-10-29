import { NextResponse } from "next/server";
import { getReadyHealth } from "@/infrastructure/health";

export const dynamic = "force-dynamic";

/** Readiness — DB up (US-E14-06 / T5.1). 503 se non pronto. */
export async function GET() {
  const { ok, body } = await getReadyHealth();
  return NextResponse.json(body, { status: ok ? 200 : 503 });
}
