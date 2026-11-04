import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth }));

import { sessionTenant } from "./session-tenant";

describe("sessionTenant", () => {
  beforeEach(() => {
    auth.mockReset();
  });

  it("returns null when unauthenticated", async () => {
    auth.mockResolvedValue(null);
    await expect(sessionTenant()).resolves.toBeNull();
  });

  it("returns null when tenant or role missing", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      tenantId: "t1",
    });
    await expect(sessionTenant()).resolves.toBeNull();
  });

  it("returns session when user, tenantId and role are present", async () => {
    const session = {
      user: { id: "u1", email: "a@b.it" },
      tenantId: "t1",
      role: "hq_ops",
    };
    auth.mockResolvedValue(session);
    await expect(sessionTenant()).resolves.toEqual(session);
  });
});
