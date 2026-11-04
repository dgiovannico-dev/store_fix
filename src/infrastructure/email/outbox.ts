import { Prisma } from "@prisma/client";
import type { Locale } from "@/i18n";
import { prisma } from "@/infrastructure/db/prisma";
import {
  claimEmailIdempotency,
  emailIdempotencyKey,
} from "./idempotency";
import {
  renderEmailTemplate,
  type EmailTemplateId,
  type TemplateVars,
} from "./templates";
import { sendEmail } from "./mailer";
import { drainEmailOutbox } from "./outbox-drain";

export { drainEmailOutbox };

export type EnqueueEmailInput = {
  to: string | string[];
  template: EmailTemplateId;
  vars?: TemplateVars;
  locale?: Locale;
  idempotencyKey?: string;
  tenantId?: string;
};

/**
 * F6-07 — enqueue into EmailOutbox (SoR). Inline send if no DATABASE / WORKER_INLINE.
 */
export async function enqueueEmail(input: EnqueueEmailInput): Promise<{
  sent: boolean;
  skipped: boolean;
}> {
  const rendered = renderEmailTemplate(
    input.template,
    input.vars,
    input.locale ?? "it",
  );
  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  let anySent = false;
  let anySkipped = false;

  for (const to of recipients) {
    const key =
      input.idempotencyKey ??
      emailIdempotencyKey({
        template: input.template,
        ticketId: input.vars?.ticketId,
        recipient: to,
      });
    if (!claimEmailIdempotency(key)) {
      anySkipped = true;
      continue;
    }

    try {
      await prisma.emailOutbox.create({
        data: {
          tenantId: input.tenantId ?? null,
          toAddr: to,
          subject: rendered.subject,
          textBody: rendered.text,
          htmlBody: rendered.html,
          idempotencyKey: key,
          status: "pending",
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        anySkipped = true;
        continue;
      }
      throw e;
    }

    const inline =
      process.env.WORKER_INLINE === "true" ||
      process.env.FF_EMAIL_INLINE === "1";
    if (inline) {
      await sendEmail({
        to,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      });
      await prisma.emailOutbox.updateMany({
        where: { idempotencyKey: key },
        data: { status: "sent", sentAt: new Date() },
      });
      anySent = true;
      continue;
    }

    const { getBoss, QUEUE_EMAIL_OUTBOX_DRAIN } = await import("../jobs/boss");
    const boss = await getBoss();
    if (!boss) {
      await drainEmailOutbox(5);
      anySent = true;
      continue;
    }

    await boss.send(
      QUEUE_EMAIL_OUTBOX_DRAIN,
      {},
      { singletonKey: "email-outbox-drain", singletonSeconds: 5 },
    );
    anySent = true;
  }

  return { sent: anySent, skipped: anySkipped };
}
