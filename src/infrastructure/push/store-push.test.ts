import { describe, expect, it, vi } from "vitest";
import { pushStoreTicketEvent } from "./store-push";

describe("pushStoreTicketEvent", () => {
  const payload = {
    event: "ticket.created",
    ticketId: "t1",
    storeId: "s1",
    storeName: "PV",
    title: "Nuovo ticket",
    body: "Descrizione",
    url: "http://localhost:3000/app/tickets/t1",
  };

  it("noop senza target", async () => {
    const fetchImpl = vi.fn();
    const r = await pushStoreTicketEvent({}, payload, fetchImpl);
    expect(r).toEqual({ webhook: false, ntfy: false });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posta webhook JSON", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    const r = await pushStoreTicketEvent(
      { webhookUrl: "https://hooks.example/ff" },
      payload,
      fetchImpl,
    );
    expect(r.webhook).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://hooks.example/ff",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("posta ntfy se base URL", async () => {
    const prev = process.env.NTFY_BASE_URL;
    process.env.NTFY_BASE_URL = "https://ntfy.example";
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    try {
      const r = await pushStoreTicketEvent(
        { ntfyTopic: "pv-milano-1" },
        payload,
        fetchImpl,
      );
      expect(r.ntfy).toBe(true);
      expect(fetchImpl.mock.calls[0][0]).toBe(
        "https://ntfy.example/pv-milano-1",
      );
    } finally {
      if (prev === undefined) delete process.env.NTFY_BASE_URL;
      else process.env.NTFY_BASE_URL = prev;
    }
  });
});
