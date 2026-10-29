import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
};

let cached: Transporter | null = null;

export function getMailer(): Transporter {
  if (cached) return cached;
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? "1025"),
    secure: false,
    // Mailpit: no auth
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  });
  return cached;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const from =
    process.env.SMTP_FROM ?? "FacilityFlow <noreply@facilityflow.local>";
  await getMailer().sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
