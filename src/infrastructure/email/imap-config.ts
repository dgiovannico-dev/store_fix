/**
 * Config IMAP inbound (F3-04). Host vuoto → poll disabilitato.
 */
export type ImapInboundConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  mailbox: string;
  tenantSlug?: string;
  tenantId?: string;
  markSeen: boolean;
  pollCron: string;
};

export function readImapInboundConfig(
  env: Record<string, string | undefined> = process.env,
): ImapInboundConfig | null {
  const host = env.IMAP_HOST?.trim();
  if (!host) return null;

  const user = env.IMAP_USER?.trim() ?? "";
  const pass = env.IMAP_PASS ?? "";
  if (!user || !pass) return null;

  const port = Number(env.IMAP_PORT ?? "993");
  const secure =
    env.IMAP_SECURE === undefined
      ? port === 993
      : env.IMAP_SECURE !== "false" && env.IMAP_SECURE !== "0";

  return {
    host,
    port: Number.isFinite(port) ? port : 993,
    secure,
    user,
    pass,
    mailbox: env.IMAP_MAILBOX?.trim() || "INBOX",
    tenantSlug: env.IMAP_TENANT_SLUG?.trim() || undefined,
    tenantId: env.IMAP_TENANT_ID?.trim() || undefined,
    markSeen: env.IMAP_MARK_SEEN !== "false" && env.IMAP_MARK_SEEN !== "0",
    pollCron: env.IMAP_POLL_CRON?.trim() || "*/2 * * * *",
  };
}
