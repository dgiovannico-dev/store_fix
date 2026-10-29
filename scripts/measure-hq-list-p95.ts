/**
 * Misura p95 lista ticket HQ sul tenant pilota (US-E10-04 / T4.2 / T4.17).
 * Target: < 300 ms.
 *
 * Uso: npx tsx scripts/measure-hq-list-p95.ts [tenantSlug=pilot-retail] [n=40]
 */
import { Role } from "@prisma/client";
import { listTicketsForMembership } from "../src/application/tickets/list-tickets";
import { prisma } from "../src/infrastructure/db/prisma";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

async function main() {
  const slug = process.argv[2] ?? "pilot-retail";
  const n = Number(process.argv[3] ?? 40);
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    console.error(`Tenant ${slug} non trovato — esegui npm run db:seed:pilot`);
    process.exit(1);
  }

  const membership = {
    role: Role.owner,
    storeIds: [] as string[],
    deletedAt: null,
    vendorId: null,
  };

  // warm-up
  await listTicketsForMembership({
    tenantId: tenant.id,
    role: Role.owner,
    membership,
    take: 50,
  });

  const samples: number[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    await listTicketsForMembership({
      tenantId: tenant.id,
      role: Role.owner,
      membership,
      take: 50,
    });
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  const p50 = percentile(samples, 50);
  const p95 = percentile(samples, 95);
  const p99 = percentile(samples, 99);
  console.log(
    JSON.stringify(
      {
        tenantSlug: slug,
        n,
        p50_ms: Number(p50.toFixed(2)),
        p95_ms: Number(p95.toFixed(2)),
        p99_ms: Number(p99.toFixed(2)),
        pass: p95 < 300,
        target_ms: 300,
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
  process.exit(p95 < 300 ? 0 : 2);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
