import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
};

let cached: Transporter | null = null;
let cachedKey = "";

function transportKey(): string {
  return [
    process.env.SMTP_TRANSPORT ?? "",
    process.env.SMTP_HOST ?? "127.0.0.1",
    process.env.SMTP_PORT ?? "1025",
  ].join("|");
}

/** Test/CI: `SMTP_TRANSPORT=json` evita dipendenza da Mailpit. */
export function getMailer(): Transporter {
  const key = transportKey();
  if (cached && cachedKey === key) return cached;

  if (
    process.env.SMTP_TRANSPORT === "json" ||
    process.env.VITEST === "true"
  ) {
    cached = nodemailer.createTransport({ jsonTransport: true });
  } else {
    cached = nodemailer.createTransport({
      // 127.0.0.1 evita ::1 flaky su Docker Desktop
      host: process.env.SMTP_HOST ?? "127.0.0.1",
      port: Number(process.env.SMTP_PORT ?? "1025"),
      secure: false,
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      socketTimeout: 10_000,
    });
  }
  cachedKey = key;
  return cached;
}

export function _resetMailerForTests(): void {
  cached = null;
  cachedKey = "";
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
