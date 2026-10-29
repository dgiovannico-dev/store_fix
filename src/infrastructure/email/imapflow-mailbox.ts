import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { ImapInboundConfig } from "./imap-config";
import type { ImapMailbox, UnseenInboundMessage } from "./imap-mailbox";

/**
 * Adapter imapflow: SEARCH unseen → fetch source → parse → opzionale \\Seen.
 */
export async function openImapflowMailbox(
  config: ImapInboundConfig,
): Promise<ImapMailbox> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    logger: false,
  });

  await client.connect();

  return {
    async fetchUnseen() {
      const lock = await client.getMailboxLock(config.mailbox);
      try {
        const uids = await client.search({ seen: false }, { uid: true });
        if (!uids || uids.length === 0) return [];

        const fetched = await client.fetchAll(
          uids,
          { source: true, envelope: true, uid: true },
          { uid: true },
        );

        const out: UnseenInboundMessage[] = [];
        for (const msg of fetched) {
          const uid = msg.uid;
          if (!uid) continue;
          const source = msg.source;
          if (!source) continue;

          const parsed = await simpleParser(source);
          const envelopeId = msg.envelope?.messageId?.trim();
          const headerId = parsed.messageId?.trim();
          const messageId =
            envelopeId ||
            headerId ||
            `imap:${config.mailbox}:${uid}`;

          const from =
            parsed.from?.value?.[0]?.address ||
            msg.envelope?.from?.[0]?.address ||
            undefined;

          out.push({
            uid,
            messageId,
            subject: parsed.subject ?? msg.envelope?.subject ?? "(senza subject)",
            text:
              parsed.text?.trim() ||
              (typeof parsed.html === "string"
                ? parsed.html.replace(/<[^>]+>/g, " ").trim()
                : "") ||
              "",
            from,
          });
        }
        return out;
      } finally {
        lock.release();
      }
    },

    async markSeen(uids: number[]) {
      if (uids.length === 0) return;
      const lock = await client.getMailboxLock(config.mailbox);
      try {
        await client.messageFlagsAdd(uids, ["\\Seen"], { uid: true });
      } finally {
        lock.release();
      }
    },

    async close() {
      try {
        await client.logout();
      } catch {
        client.close();
      }
    },
  };
}
