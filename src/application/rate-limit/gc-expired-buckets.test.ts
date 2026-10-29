import { beforeEach, describe, expect, it, vi } from "vitest";

const count = vi.fn();
const deleteMany = vi.fn();

vi.mock("@/infrastructure/db/prisma", () => ({
  prisma: {
    rateLimitBucket: { count, deleteMany },
  },
}));

describe("gcExpiredRateLimitBuckets", () => {
  beforeEach(() => {
    count.mockReset();
    deleteMany.mockReset();
    delete process.env.RATE_LIMIT_GC_DRY_RUN;
  });

  it("dryRun conta senza cancellare", async () => {
    count.mockResolvedValue(3);
    const { gcExpiredRateLimitBuckets } = await import("./gc-expired-buckets");
    const now = new Date("2026-10-29T12:00:00.000Z");
    const r = await gcExpiredRateLimitBuckets({ now, dryRun: true });
    expect(r).toEqual({
      cutoff: now.toISOString(),
      dryRun: true,
      deleted: 3,
    });
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("deleteMany su resetAt scaduti", async () => {
    deleteMany.mockResolvedValue({ count: 7 });
    const { gcExpiredRateLimitBuckets } = await import("./gc-expired-buckets");
    const now = new Date("2026-10-29T12:00:00.000Z");
    const r = await gcExpiredRateLimitBuckets({ now });
    expect(r.deleted).toBe(7);
    expect(r.dryRun).toBe(false);
    expect(deleteMany).toHaveBeenCalledWith({
      where: { resetAt: { lt: now } },
    });
  });
});
