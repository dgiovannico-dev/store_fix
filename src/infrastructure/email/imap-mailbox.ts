/**
 * Port IMAP per poll UNSEEN (F3-04) — implementato da imapflow.
 */
export type UnseenInboundMessage = {
  uid: number;
  messageId: string;
  subject: string;
  text: string;
  from?: string;
};

export type ImapMailbox = {
  fetchUnseen(): Promise<UnseenInboundMessage[]>;
  markSeen(uids: number[]): Promise<void>;
  close(): Promise<void>;
};
