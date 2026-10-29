import { describe, expect, it, vi } from "vitest";
import type { ImapInboundConfig } from "@/infrastructure/email/imap-config";
import type { ImapMailbox } from "@/infrastructure/email/imap-mailbox";
import { pollImapInbound } from "./poll-imap";

const baseConfig: ImapInboundConfig = {
  host: "imap.example",
  port: 993,
  secure: true,
  user: "u",
  pass: "p",
  mailbox: "INBOX",
  tenantSlug: "pilot-retail",
  markSeen: true,
  pollCron: "*/2 * * * *",
};

function fakeMailbox(
  messages: Awaited<ReturnType<ImapMailbox["fetchUnseen"]>>,
): ImapMailbox & { marked: number[] } {
  const marked: number[] = [];
  return {
    marked,
    fetchUnseen: async () => messages,
    markSeen: async (uids) => {
      marked.push(...uids);
    },
    close: async () => undefined,
  };
}

describe("pollImapInbound", () => {
  it("skip se IMAP non configurato", async () => {
    const r = await pollImapInbound({
      config: null,
      openMailbox: async () => fakeMailbox([]),
    });
    expect(r.skipped).toBe(true);
    expect(r.fetched).toBe(0);
  });

  it("processa UNSEEN, dedup e markSeen solo su ok", async () => {
    const mb = fakeMailbox([
      {
        uid: 10,
        messageId: "<a@mail>",
        subject: "[store:PV] Frigo",
        text: "alta temp",
        from: "a@x.it",
      },
      {
        uid: 11,
        messageId: "<b@mail>",
        subject: "[store:PV] Ok",
        text: "b",
      },
      {
        uid: 12,
        messageId: "<c@mail>",
        subject: "senza store",
        text: "fail",
      },
    ]);

    const process = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, ticketId: "t1" })
      .mockResolvedValueOnce({ ok: true, ticketId: "t1", duplicate: true })
      .mockResolvedValueOnce({ ok: false, message: "no store" });

    const r = await pollImapInbound({
      config: baseConfig,
      openMailbox: async () => mb,
      process,
    });

    expect(r.skipped).toBe(false);
    expect(r.fetched).toBe(3);
    expect(r.created).toBe(1);
    expect(r.duplicates).toBe(1);
    expect(r.failed).toBe(1);
    expect(mb.marked).toEqual([10, 11]);
    expect(process).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: "<a@mail>",
        tenantSlug: "pilot-retail",
      }),
    );
  });
});
