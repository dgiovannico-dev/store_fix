import { describe, expect, it } from "vitest";
import * as repo from "./ticket-event-repository";

describe("ticket-event-repository", () => {
  it("espone solo append/list (nessun update/delete pubblico)", () => {
    expect(typeof repo.appendTicketEvent).toBe("function");
    expect(typeof repo.listTicketEvents).toBe("function");
    expect(
      Object.keys(repo).filter((k) => /update|delete/i.test(k)),
    ).toEqual([]);
  });
});
