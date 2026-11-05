"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ackWeeklyDigest } from "@/application/digest/ack-digest";

export async function ackDigestAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return;
  }
  const weekKey = String(formData.get("weekKey") ?? "");
  await ackWeeklyDigest({
    tenantId: session.tenantId,
    userId: session.user.id,
    weekKey: weekKey || undefined,
  });
  revalidatePath("/app/dashboard");
}
