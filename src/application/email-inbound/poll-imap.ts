import {
  processInboundEmail,
  type InboundEmailPayload,
} from "@/application/email-inbound/process-inbound";
import type { ImapInboundConfig } from "@/infrastructure/email/imap-config";
import type { ImapMailbox } from "@/infrastructure/email/imap-mailbox";

export type PollImapResult = {
  skipped: boolean;
  reason?: string;
  fetched: number;
  created: number;
  duplicates: number;
  failed: number;
};

/**
 * Poll IMAP UNSEEN → processInboundEmail (F3-04).
 * Mark \\Seen solo su ok/duplicate se config.markSeen.
 */
export async function pollImapInbound(opts: {
  config: ImapInboundConfig | null;
  openMailbox: (config: ImapInboundConfig) => Promise<ImapMailbox>;
  process?: typeof processInboundEmail;
}): Promise<PollImapResult> {
  const { config, openMailbox } = opts;
  const process = opts.process ?? processInboundEmail;

  if (!config) {
    return {
      skipped: true,
      reason: "IMAP_HOST non configurato",
      fetched: 0,
      created: 0,
      duplicates: 0,
      failed: 0,
    };
  }

  if (!config.tenantId && !config.tenantSlug) {
    return {
      skipped: true,
      reason: "IMAP_TENANT_ID o IMAP_TENANT_SLUG obbligatorio",
      fetched: 0,
      created: 0,
      duplicates: 0,
      failed: 0,
    };
  }

  const mailbox = await openMailbox(config);
  try {
    const messages = await mailbox.fetchUnseen();
    let created = 0;
    let duplicates = 0;
    let failed = 0;
    const seenUids: number[] = [];

    for (const msg of messages) {
      const payload: InboundEmailPayload = {
        messageId: msg.messageId,
        subject: msg.subject,
        text: msg.text,
        from: msg.from,
        tenantId: config.tenantId,
        tenantSlug: config.tenantSlug,
      };

      const result = await process(payload);
      if (result.ok) {
        if (result.duplicate) duplicates += 1;
        else created += 1;
        seenUids.push(msg.uid);
      } else {
        failed += 1;
      }
    }

    if (config.markSeen && seenUids.length > 0) {
      await mailbox.markSeen(seenUids);
    }

    return {
      skipped: false,
      fetched: messages.length,
      created,
      duplicates,
      failed,
    };
  } finally {
    await mailbox.close();
  }
}
