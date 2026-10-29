import { NextResponse } from "next/server";
import { getLiveHealth } from "@/infrastructure/health";

export const dynamic = "force-dynamic";

/** Liveness — processo up (US-E14-06 / T5.1). */
export async function GET() {
  return NextResponse.json(getLiveHealth());
}
