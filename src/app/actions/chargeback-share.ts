"use server";

import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { listChargebackByStore } from "@/application/finance/chargeback-query";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { enqueueEmail } from "@/infrastructure/email/outbox";
import { actionError } from "@/i18n/action-errors";
import { appBaseUrl } from "@/lib/app-urls";

export type ChargebackShareState = { ok?: boolean; error?: string };

const HQ = new Set<Role>([
  Role.owner,
  Role.admin_hq,
  Role.ops_coordinator,
  Role.viewer_finance,
]);

/** F9-05 — email chargeback summary to CFO. */
export async function shareChargebackAction(
  _prev: ChargebackShareState,
  formData: FormData,
): Promise<ChargebackShareState> {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    return { error: await actionError("accessRequired") };
  }
  if (!HQ.has(session.role)) {
    return { error: await actionError("accessRequired") };
  }
  const email = String(formData.get("email") ?? "").trim();
  const days = Math.min(
    Math.max(Number(formData.get("days") ?? 30) || 30, 7),
    365,
  );
  if (!email.includes("@")) {
    return { error: await actionError("invalidJson") };
  }

  const [rows, prefs] = await Promise.all([
    listChargebackByStore(session.tenantId, days),
    getTenantI18nPrefs(session.tenantId),
  ]);
  const lines = rows
    .map(
      (r) =>
        `${r.name}: tickets=${r.tickets} stimato=${r.estimated.toFixed(2)} effettivo=${r.actual.toFixed(2)}`,
    )
    .join("\n");
  await enqueueEmail({
    to: email,
    tenantId: session.tenantId,
    template: "chargeback_share",
    locale: prefs.locale,
    vars: {
      storeName: `${days}d`,
      summary: lines || "(nessuna riga)",
      acceptUrl: `${appBaseUrl()}/app/finance/chargeback?days=${days}`,
    },
    idempotencyKey: `chargeback-share:${session.tenantId}:${email}:${days}:${Date.now()}`,
  });
  return { ok: true };
}
