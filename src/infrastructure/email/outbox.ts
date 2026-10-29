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

export type EnqueueEmailInput = {
  to: string | string[];
  template: EmailTemplateId;
  vars?: TemplateVars;
  /** Override chiave; default template+ticketId+recipient */
  idempotencyKey?: string;
};

/**
 * Enqueue immediato (dev) oppure via pg-boss job `email.send` (worker).
 * In MVP S1: se WORKER_INLINE=true o senza boss → invio diretto.
 * T2.25: skip se chiave idempotenza già claimata.
 */
export async function enqueueEmail(input: EnqueueEmailInput): Promise<{
  sent: boolean;
  skipped: boolean;
}> {
  const rendered = renderEmailTemplate(input.template, input.vars);
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

    const { getBoss } = await import("../jobs/boss");
    const boss = await getBoss();
    if (!boss) {
      await sendEmail({
        to,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      });
      anySent = true;
      continue;
    }
    await boss.send(
      "email.send",
      {
        to,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
        idempotencyKey: key,
      },
      {
        retryLimit: 5,
        retryBackoff: true,
        retryDelay: 30,
        singletonKey: key,
        singletonSeconds: 86_400,
      },
    );
    anySent = true;
  }

  return { sent: anySent, skipped: anySkipped };
}
