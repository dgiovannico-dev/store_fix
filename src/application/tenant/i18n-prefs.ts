import type { Role } from "@prisma/client";
import { z } from "zod";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCanMutate } from "@/domain/rbac/guards";
import { dateLocaleFor, isLocale, type Locale } from "@/i18n";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

export type TenantI18nPrefs = {
  locale: Locale;
  currency: string;
  dateLocale: string;
};

const updateSchema = z.object({
  defaultLocale: z.enum(["it", "en"]),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/, "currency ISO 4217"),
  dateLocale: z.string().trim().min(2).max(16).optional(),
});

export async function getTenantI18nPrefs(
  tenantId: string,
): Promise<TenantI18nPrefs> {
  requireTenantId(tenantId);
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { defaultLocale: true, currency: true, dateLocale: true },
  });
  const locale: Locale = isLocale(tenant?.defaultLocale ?? "")
    ? (tenant!.defaultLocale as Locale)
    : "it";
  return {
    locale,
    currency: tenant?.currency || "EUR",
    dateLocale: tenant?.dateLocale || dateLocaleFor(locale),
  };
}

export async function updateTenantI18nPrefs(input: {
  tenantId: string;
  role: Role;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.manageTenant);
  const parsed = updateSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, code: "invalidLocalePrefs" };
  }
  const dateLocale =
    parsed.data.dateLocale?.trim() ||
    dateLocaleFor(parsed.data.defaultLocale);
  const tenant = await prisma.tenant.update({
    where: { id: input.tenantId },
    data: {
      defaultLocale: parsed.data.defaultLocale,
      currency: parsed.data.currency,
      dateLocale,
    },
  });
  return { ok: true as const, tenant };
}
