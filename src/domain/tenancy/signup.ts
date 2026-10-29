import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { prisma } from "@/infrastructure/db/prisma";
import { slugifyTenantName } from "./slug";

/** Messaggi Zod = chiavi `domainErrors` (risolte al boundary UI). */
const SignupField = {
  nameRequired: "signupNameRequired",
  emailInvalid: "signupEmailInvalid",
  passwordTooShort: "signupPasswordTooShort",
  passwordTooLong: "signupPasswordTooLong",
  workspaceRequired: "signupWorkspaceRequired",
} as const;

export const signupInputSchema = z.object({
  name: z.string().trim().min(2, SignupField.nameRequired).max(120),
  email: z.string().trim().email(SignupField.emailInvalid).max(254),
  password: z
    .string()
    .min(8, SignupField.passwordTooShort)
    .max(72, SignupField.passwordTooLong),
  workspaceName: z
    .string()
    .trim()
    .min(2, SignupField.workspaceRequired)
    .max(120),
});

export type SignupInput = z.infer<typeof signupInputSchema>;

export type SignupFailCode =
  | "signupEmailTaken"
  | "signupSlugTaken"
  | "signupValidation"
  | (typeof SignupField)[keyof typeof SignupField];

export type SignupResult =
  | {
      ok: true;
      userId: string;
      tenantId: string;
      tenantSlug: string;
      email: string;
    }
  | {
      ok: false;
      code: SignupFailCode;
      message: string;
    };

/**
 * Crea atomicamente User + Tenant + Membership owner (US-E01-01 / T1.12).
 */
export async function signupHqOwner(raw: unknown): Promise<SignupResult> {
  const parsed = signupInputSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "signupValidation";
    const fieldCodes = new Set<string>(Object.values(SignupField));
    const code = (
      fieldCodes.has(issue) ? issue : "signupValidation"
    ) as SignupFailCode;
    return {
      ok: false,
      code,
      message: issue,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      code: "signupEmailTaken",
      message: "Impossibile completare la registrazione con questi dati.",
    };
  }

  let slug = slugifyTenantName(parsed.data.workspaceName);
  const slugTaken = await prisma.tenant.findUnique({ where: { slug } });
  if (slugTaken) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: parsed.data.name,
          passwordHash,
        },
      });

      const tenant = await tx.tenant.create({
        data: {
          name: parsed.data.workspaceName,
          slug,
          region: "EU",
        },
      });

      await tx.membership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: Role.owner,
          storeIds: [],
        },
      });

      await ensureDefaultSlaPolicies(tx, tenant.id);
      await tx.onboardingProgress.create({
        data: { tenantId: tenant.id, sampleTicketSkipped: true },
      });

      return { user, tenant };
    });

    return {
      ok: true,
      userId: result.user.id,
      tenantId: result.tenant.id,
      tenantSlug: result.tenant.slug,
      email: result.user.email,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint") && msg.includes("slug")) {
      return {
        ok: false,
        code: "signupSlugTaken",
        message: "Nome workspace già in uso. Scegline un altro.",
      };
    }
    throw e;
  }
}
