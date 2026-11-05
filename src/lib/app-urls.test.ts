import { afterEach, describe, expect, it } from "vitest";
import {
  appBaseUrl,
  digestAckDeepLink,
  segnalaStoreDeepLink,
  ticketDeepLink,
  ticketPathForRole,
  ticketsListDeepLink,
} from "./app-urls";

describe("app-urls", () => {
  const prev = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prev;
  });

  it("trims trailing slash and falls back to localhost", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://ff.example.com/";
    expect(appBaseUrl()).toBe("https://ff.example.com");
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(appBaseUrl()).toBe("http://localhost:3000");
  });

  it("builds ticket / list / digest / segnala links", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.test";
    expect(ticketDeepLink("t1")).toBe("https://app.test/app/tickets/t1");
    expect(ticketsListDeepLink()).toBe("https://app.test/app/tickets");
    expect(digestAckDeepLink("2026-W45")).toBe(
      "https://app.test/app/dashboard?digestAck=2026-W45",
    );
    expect(segnalaStoreDeepLink("s1")).toBe(
      "https://app.test/app/segnala/s1",
    );
  });

  it("ticketPathForRole is relative and role-aware", () => {
    expect(ticketPathForRole("vendor", "x")).toBe("/vendor/tickets/x");
    expect(ticketPathForRole("owner", "x")).toBe("/app/tickets/x");
  });
});
