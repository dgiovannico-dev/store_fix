import { describe, expect, it } from "vitest";
import { readImapInboundConfig } from "./imap-config";

describe("readImapInboundConfig", () => {
  it("null senza IMAP_HOST", () => {
    expect(readImapInboundConfig({})).toBeNull();
  });

  it("null senza user/pass", () => {
    expect(
      readImapInboundConfig({ IMAP_HOST: "imap.example" }),
    ).toBeNull();
  });

  it("legge defaults sicuri", () => {
    const c = readImapInboundConfig({
      IMAP_HOST: "imap.example",
      IMAP_USER: "inbox@example",
      IMAP_PASS: "secret",
      IMAP_TENANT_SLUG: "pilot-retail",
    });
    expect(c).toMatchObject({
      host: "imap.example",
      port: 993,
      secure: true,
      mailbox: "INBOX",
      markSeen: true,
      pollCron: "*/2 * * * *",
      tenantSlug: "pilot-retail",
    });
  });
});
