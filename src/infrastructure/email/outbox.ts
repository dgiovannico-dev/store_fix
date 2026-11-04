import { Prisma } from "@prisma/client";
import type { Locale } from "@/i18n";
import { prisma } from "@/infrastructure/db/prisma";
import { emailIdempotencyKey } from "./idempotency";
import {
  renderEmailTemplate,
  type EmailTemplateId,
  type TemplateVars,
} from "./templates";

export type DbClient = Prisma.TransactionClient | typeof prisma;

export type AppendEmailOutboxInput = {
  to: string;
  template: EmailTemplateId;
  vars?: TemplateVars;
  locale?: Locale;
  idempotencyKey?: string;
  tenantId?: string | null;
};

export type EnqueueEmailInput = {
  to: string | string[];
  template: EmailTemplateId;
  vars?: TemplateVars;
  locale?: Locale;
  idempotencyKey?: string;
  tenantId?: string;
};

/**
 * Append rendered email into EmailOutbox inside an existing TX (or prisma).
 * Unique idempotencyKey → skipped: true (no second row).
 */
export async function appendEmailOutbox(
  db: DbClient,
  input: AppendEmailOutboxInput,
): Promise<{ id: string; skipped: boolean }> {
  const rendered = renderEmailTemplate(
    input.template,
    input.vars,
    input.locale ?? "it",
  );
  const key =
    input.idempotencyKey ??
    emailIdempotencyKey({
      template: input.template,
      ticketId: input.vars?.ticketId,
      recipient: input.to,
    });

  const existing = await db.emailOutbox.findUnique({
    where: { idempotencyKey: key },
    select: { id: true, status: true },
  });
  if (existing) {
    return { id: existing.id, skipped: true };
  }

  try {
    const row = await db.emailOutbox.create({
      data: {
        tenantId: input.tenantId ?? null,
        toAddr: input.to,
        subject: rendered.subject,
        textBody: rendered.text,
        htmlBody: rendered.html,
        template: input.template,
        idempotencyKey: key,
        status: "pending",
        nextAttemptAt: new Date(),
      },
      select: { id: true },
    });
    return { id: row.id, skipped: false };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const again = await db.emailOutbox.findUnique({
        where: { idempotencyKey: key },
        select: { id: true },
      });
      return { id: again?.id ?? "", skipped: true };
    }
    throw e;
  }
}

/**
 * Compat: append one+ recipients outside a domain TX (still durable SoR).
 * Optionally kicks dispatcher (pg-boss or inline process).
 */
export async function enqueueEmail(input: EnqueueEmailInput): Promise<{
  sent: boolean;
  skipped: boolean;
}> {
  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  let anyQueued = false;
  let anySkipped = false;

  for (const to of recipients) {
    const keyBase = input.idempotencyKey
      ? recipients.length === 1
        ? input.idempotencyKey
        : `${input.idempotencyKey}:${to.trim().toLowerCase()}`
      : undefined;
    const result = await appendEmailOutbox(prisma, {
      to,
      template: input.template,
      vars: input.vars,
      locale: input.locale,
      tenantId: input.tenantId,
      idempotencyKey: keyBase,
    });
    if (result.skipped) anySkipped = true;
    else anyQueued = true;
  }

  if (anyQueued) {
    await kickEmailOutboxDispatch();
  }

  return { sent: anyQueued, skipped: anySkipped };
}

async function drainOutboxInline(): Promise<void> {
  const { processEmailOutboxBatch } = await import(
    "@/application/email/dispatch-outbox"
  );
  for (let i = 0; i < 50; i += 1) {
    const result = await processEmailOutboxBatch(50);
    if (result.claimed === 0) break;
  }
}

export async function kickEmailOutboxDispatch(): Promise<void> {
  const inline =
    process.env.WORKER_INLINE === "true" ||
    process.env.FF_EMAIL_INLINE === "1" ||
    process.env.PGBOSS_DISABLED === "true";

  if (inline) {
    await drainOutboxInline();
    return;
  }

  const { getBoss, QUEUE_EMAIL_OUTBOX_DISPATCH } = await import("../jobs/boss");
  const boss = await getBoss();
  if (!boss) {
    await drainOutboxInline();
    return;
  }
  await boss.send(
    QUEUE_EMAIL_OUTBOX_DISPATCH,
    {},
    { singletonKey: "email-outbox-dispatch", singletonSeconds: 4 },
  );
}
